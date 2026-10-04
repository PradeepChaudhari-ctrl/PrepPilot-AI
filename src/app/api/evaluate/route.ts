import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer, topic, languageMode = "English" } = body;

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const evaluation = await evaluateAnswer({
      question,
      answer: answer || "",
      topic,
      languageMode,
    });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("POST /api/evaluate error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate answer" }, { status: 500 });
  }
}
