/**
 * Heurística leve para dar uma dica de idioma ao modelo. A decisão final de
 * idioma é do Claude (campo `language` no output), mas passar uma dica reduz
 * ambiguidade em descrições curtas.
 */
const PT_MARKERS = [
  " e ",
  " de ",
  " para ",
  " com ",
  " que ",
  " não ",
  "você",
  "experiência",
  "vaga",
  "requisitos",
  "responsabilidades",
  "conhecimento",
  "salário",
  "benefícios",
  "ç",
  "ã",
  "õ",
  "á",
  "é",
  "í",
  "ó",
  "ú",
];

const EN_MARKERS = [
  " the ",
  " and ",
  " for ",
  " with ",
  " you ",
  " we ",
  "experience",
  "requirements",
  "responsibilities",
  "skills",
  "salary",
  "benefits",
  "you'll",
];

export function detectLanguageHint(text: string): "pt" | "en" {
  const lower = ` ${text.toLowerCase()} `;
  let pt = 0;
  let en = 0;
  for (const m of PT_MARKERS) if (lower.includes(m)) pt++;
  for (const m of EN_MARKERS) if (lower.includes(m)) en++;
  return pt >= en ? "pt" : "en";
}
