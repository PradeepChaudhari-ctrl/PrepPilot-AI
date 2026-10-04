export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to prevent client bundling issues
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const cleanedText = data.text
      .replace(/\r\n/g, "\n")
      .replace(/\n\s*\n/g, "\n")
      .trim();
    return cleanedText;
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    throw new Error(
      error?.message || "Failed to parse PDF file. You can paste the resume text directly as a fallback."
    );
  }
}
