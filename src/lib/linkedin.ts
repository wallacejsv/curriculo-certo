import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extrai texto do PDF que o LinkedIn gera em "Mais → Salvar como PDF".
 * unpdf empacota o pdf.js e roda em Node sem dependências nativas.
 */
export async function pdfToText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // Com mergePages: true, `text` é uma única string com todas as páginas.
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}
