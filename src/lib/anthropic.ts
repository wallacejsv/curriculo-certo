import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  ResumeSchema,
  CoverLetterSchema,
  type Application,
  type Resume,
  type CoverLetter,
} from "./schema";
import {
  buildResumeSystemPrompt,
  buildCoverLetterSystemPrompt,
  buildUserPrompt,
  type GenerationInput,
} from "./prompt";

const MODEL = process.env.RESUME_MODEL || "claude-sonnet-5";

// Currículo e carta são gerados em DUAS chamadas separadas (uma tool cada).
// Com o schema combinado o modelo às vezes serializava um campo como string
// JSON e derrubava o outro — falha irrecuperável. Com tools de objeto único,
// se ele serializar, o input vira uma string no topo que recuperamos com
// JSON.parse (coerceObject); e não há "outro campo" para se perder.
const MAX_ATTEMPTS = 3;

const resumeProperties = {
  language: { type: "string", enum: ["pt", "en"] },
  contact: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      location: { type: "string" },
      linkedin: { type: "string" },
      website: { type: "string" },
    },
  },
  headline: { type: "string" },
  summary: { type: "string" },
  experience: {
    type: "array",
    items: {
      type: "object",
      required: ["role", "company", "period", "bullets"],
      properties: {
        role: { type: "string" },
        company: { type: "string" },
        location: { type: "string" },
        period: {
          type: "string",
          description: "e.g. 'Jan 2022 – Present' / 'jan 2022 – atual'",
        },
        bullets: { type: "array", items: { type: "string" } },
      },
    },
  },
  skills: { type: "array", items: { type: "string" } },
  education: {
    type: "array",
    items: {
      type: "object",
      required: ["degree", "institution"],
      properties: {
        degree: { type: "string" },
        institution: { type: "string" },
        year: { type: "string" },
      },
    },
  },
  certifications: { type: "array", items: { type: "string" } },
  languages: {
    type: "array",
    items: {
      type: "object",
      required: ["name", "level"],
      properties: {
        name: { type: "string" },
        level: { type: "string" },
      },
    },
  },
  keywordsMatched: { type: "array", items: { type: "string" } },
} as const;

const resumeTool: Anthropic.Tool = {
  name: "emit_resume",
  description:
    "Emit the tailored resume for the target job as a structured JSON object (never a JSON string).",
  input_schema: {
    type: "object",
    required: [
      "language",
      "contact",
      "headline",
      "summary",
      "experience",
      "skills",
      "education",
      "keywordsMatched",
    ],
    properties: resumeProperties,
  },
};

const coverLetterTool: Anthropic.Tool = {
  name: "emit_cover_letter",
  description:
    "Emit the tailored cover letter for the target job as a structured JSON object (never a JSON string).",
  input_schema: {
    type: "object",
    required: ["greeting", "paragraphs", "closing"],
    properties: {
      greeting: { type: "string" },
      paragraphs: { type: "array", items: { type: "string" } },
      closing: { type: "string" },
    },
  },
};

/**
 * Recupera respostas em que o modelo serializou o objeto inteiro como string
 * JSON: faz JSON.parse do input quando ele chega como string.
 */
function coerceObject(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

interface ToolCallOptions<T> {
  system: string;
  userPrompt: string;
  tool: Anthropic.Tool;
  schema: z.ZodType<T>;
  label: string;
}

/**
 * Faz uma chamada de tool única com retry + coerção + validação Zod.
 * Lança um erro amigável se todas as tentativas falharem.
 */
async function callTool<T>(
  client: Anthropic,
  { system, userPrompt, tool, schema, label }: ToolCallOptions<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: userPrompt }],
    });

    // Truncamento por tamanho corta o JSON no meio. Retry não ajuda: erro claro.
    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "A geração foi interrompida por limite de tamanho. Tente gerar novamente; se persistir, encurte a descrição da vaga ou o perfil.",
      );
    }

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (!toolUse) {
      lastError = "sem bloco tool_use na resposta";
      continue;
    }

    const parsed = schema.safeParse(coerceObject(toolUse.input));
    if (parsed.success) {
      return parsed.data;
    }

    lastError = parsed.error.issues;
    console.error(
      `[${label}] tentativa ${attempt}/${MAX_ATTEMPTS} com resposta malformada:`,
      JSON.stringify(lastError),
    );
  }

  console.error(
    `[${label}] falha ao validar após todas as tentativas:`,
    JSON.stringify(lastError, null, 2),
  );
  throw new Error(
    "O modelo retornou dados fora do formato esperado após várias tentativas. Tente gerar novamente.",
  );
}

export async function generateApplication(
  input: GenerationInput,
): Promise<Application> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Preencha a chave no arquivo .env.",
    );
  }

  const client = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(input);

  // Chamadas independentes → rodam em paralelo, mantendo a latência de uma só.
  const [resume, coverLetter] = await Promise.all([
    callTool<Resume>(client, {
      system: buildResumeSystemPrompt(),
      userPrompt,
      tool: resumeTool,
      schema: ResumeSchema,
      label: "resume",
    }),
    callTool<CoverLetter>(client, {
      system: buildCoverLetterSystemPrompt(),
      userPrompt,
      tool: coverLetterTool,
      schema: CoverLetterSchema,
      label: "cover-letter",
    }),
  ]);

  return { resume, coverLetter };
}
