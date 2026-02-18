/**
 * Resume Text Extraction - PDF & DOCX
 * Equivalent to pdfplumber (PDF) + python-docx (DOCX) in Python
 */

import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
];

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME.includes(mimeType);
}

export function getFileExtension(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (mimeType === "application/msword") return "doc";
  return "bin";
}

/**
 * Extract plain text from PDF or DOCX buffer.
 * Removes extra spaces, empty lines. Handles corrupted files safely.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!isAllowedMimeType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  try {
    let text: string;

    if (mimeType === "application/pdf") {
      const pdfDoc = await getDocumentProxy(new Uint8Array(buffer));
      const { text: extracted } = await extractText(pdfDoc, { mergePages: true });
      text = extracted ?? "";
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    return cleanText(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to extract text from resume: ${msg}`);
  }
}

function cleanText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return (
    text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/ +/g, " ") // collapse multiple spaces
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0) // remove empty lines
      .join("\n")
      .trim()
  );
}
