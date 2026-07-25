import { NextRequest, NextResponse } from "next/server";
import { generateApplication } from "@/lib/anthropic";
import { pdfToText } from "@/lib/linkedin";
import { detectLanguageHint } from "@/lib/language";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const jobTitle = String(form.get("jobTitle") || "").trim();
    const jobDescription = String(form.get("jobDescription") || "").trim();
    let linkedinText = String(form.get("linkedinText") || "").trim();

    const file = form.get("linkedinPdf");
    if (file instanceof File && file.size > 0) {
      const buffer = await file.arrayBuffer();
      linkedinText = await pdfToText(buffer);
    }

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Informe o título e a descrição da vaga." },
        { status: 400 },
      );
    }
    if (!linkedinText) {
      return NextResponse.json(
        {
          error:
            "Informe seu perfil do LinkedIn (cole o texto ou envie o PDF exportado).",
        },
        { status: 400 },
      );
    }

    const languageHint = detectLanguageHint(jobDescription);
    const application = await generateApplication({
      jobTitle,
      jobDescription,
      linkedinText,
      languageHint,
    });

    return NextResponse.json(application);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro inesperado ao gerar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
