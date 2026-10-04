import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradePracticeDrillAttempt } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drillId, userAttempt } = body;

    if (!drillId || !userAttempt) {
      return NextResponse.json({ error: "drillId and userAttempt are required" }, { status: 400 });
    }

    const drill = await prisma.practiceDrill.findUnique({
      where: { id: drillId },
      include: { weakness: true },
    });

    if (!drill) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    const gradeResult = await gradePracticeDrillAttempt({
      drillTitle: drill.title,
      prompt: drill.prompt,
      sampleBestAnswer: drill.sampleBestAnswer || "",
      userAttempt,
    });

    const updatedDrill = await prisma.practiceDrill.update({
      where: { id: drill.id },
      data: {
        userAttempt,
        aiGradeScore: gradeResult.score,
        aiFeedback: gradeResult.feedback,
        isCompleted: gradeResult.passed,
      },
      include: { weakness: true },
    });

    // If passed and linked to weakness, mark weakness as PRACTICED
    if (gradeResult.passed && drill.weaknessId) {
      await prisma.weakness.update({
        where: { id: drill.weaknessId },
        data: {
          status: "PRACTICED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      grade: gradeResult,
      drill: updatedDrill,
    });
  } catch (error: any) {
    console.error("POST /api/drills/attempt error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit drill attempt" }, { status: 500 });
  }
}
