import { NextRequest, NextResponse } from "next/server";
import { generateQuestion } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, resumeData, history = [], topicProgress = [], round = "Technical", questionNumber = 1 } = body;

    if (!profile || !profile.name) {
      return NextResponse.json({ error: "Profile with name is required" }, { status: 400 });
    }

    const questionObj = await generateQuestion({
      profile,
      resumeData,
      history,
      topicProgress,
      round,
      questionNumber,
    });

    return NextResponse.json(questionObj);
  } catch (error: any) {
    console.error("POST /api/question error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate question" }, { status: 500 });
  }
}
