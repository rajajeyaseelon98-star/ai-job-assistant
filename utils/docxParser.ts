import mammoth from "mammoth";

/**
 * Extract text from DOCX buffer.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}
