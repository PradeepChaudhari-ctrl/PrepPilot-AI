import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const parsedText = await extractTextFromPDF(buffer);

      return NextResponse.json({
        success: true,
        fileName: file.name,
        text: parsedText,
        wordCount: parsedText.split(/\s+/).filter(Boolean).length,
      });
    }

    // Direct JSON text paste fallback
    const body = await req.json();
    if (!body.text) {
      return NextResponse.json({ error: "No resume text provided" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      fileName: "Pasted Resume Text",
      text: body.text.trim(),
      wordCount: body.text.trim().split(/\s+/).filter(Boolean).length,
    });
  } catch (error: any) {
    console.error("POST /api/resume/parse error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process resume. Please paste the resume text directly.",
        fallbackAvailable: true,
      },
      { status: 500 }
    );
  }
}
