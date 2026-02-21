/**
 * Resume Text Extraction - PDF & DOCX
 * Uses pdf-parse (PDF) + mammoth (DOCX).
 * PDF extraction is dynamically imported to avoid build-time DOMMatrix errors.
 */

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
      // pdf-parse v1 is CJS; default export is the parse function
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      text = result?.text ?? "";
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
