/// <reference types="node" />

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");

  // max: 0 means ALL pages (not limited)
  const data = await pdfParse(buffer, { max: 0 });
  let text: string = data.text ?? "";

  // Clean up common PDF extraction artifacts
  text = text
    // Normalize multiple spaces to single space
    .replace(/[ \t]{2,}/g, " ")
    // Normalize multiple newlines to max 2
    .replace(/\n{3,}/g, "\n\n")
    // Remove null bytes and control chars except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  return text;
}
