import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { studentId, answers } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "At least one answer is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        studentId,
        answers: {
          create: answers.map((item: any) => ({
            round: item.round || "General",
            question: item.question || "",
            answer: item.answer || "",
            topic: item.topic || "General",
            score:
              typeof item.score === "number"
                ? item.score
                : null,
            breakdownJson: item.breakdown
              ? JSON.stringify(item.breakdown)
              : null,
            feedbackJson: item.feedback
              ? JSON.stringify(item.feedback)
              : null,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        studentId: interview.studentId,
        createdAt: interview.createdAt,
        answers: interview.answers,
      },
    });
  } catch (error) {
    console.error("Interview creation error:", error);

    return NextResponse.json(
      {
        error: "Failed to save interview",
      },
      { status: 500 }
    );
  }
}