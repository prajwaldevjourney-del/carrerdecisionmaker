/// <reference types="node" />

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // pdf-parse tries to load a test file when imported at module level in Next.js.
  // We work around this by pointing it to a dummy test file path via options.
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer, { max: 0 });
  return data.text as string;
}
