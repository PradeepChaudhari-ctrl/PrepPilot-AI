import { NextRequest, NextResponse } from "next/server";
import { analyzeResume } from "@/lib/gemini";
import { extractTextFromPDF } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let resumeText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      resumeText = await extractTextFromPDF(Buffer.from(bytes));
    } else {
      const body = await req.json();
      resumeText = body.resumeText || "";
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: "Resume text is empty" }, { status: 400 });
    }

    const analysis = await analyzeResume(resumeText);
    return NextResponse.json({
      success: true,
      resumeText,
      ...analysis,
    });
  } catch (error: any) {
    console.error("POST /api/resume-analyze error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}
