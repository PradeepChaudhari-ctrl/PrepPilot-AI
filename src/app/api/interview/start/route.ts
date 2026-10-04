import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInterviewQuestions } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, sessionType = "DIAGNOSTIC" } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        weaknesses: {
          where: {
            status: { in: ["ACTIVE", "PRACTICED"] },
          },
        },
        interviews: {
          orderBy: { sessionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const nextSessionNumber = (student.interviews[0]?.sessionNumber || 0) + 1;
    const isReInterview = sessionType === "RE_INTERVIEW" || nextSessionNumber > 1;
    const finalSessionType = isReInterview ? "RE_INTERVIEW" : "DIAGNOSTIC";

    const targetedWeaknesses = student.weaknesses.map((w) => ({
      id: w.id,
      topic: w.topic,
      description: w.description,
      category: w.category,
    }));

    // Generate tailored questions
    const generatedQuestions = await generateInterviewQuestions({
      studentName: student.name,
      targetRole: student.targetRole,
      companyTier: student.targetCompanyTier,
      resumeText: student.resumeText || undefined,
      sessionType: finalSessionType,
      targetedWeaknesses: isReInterview ? targetedWeaknesses : undefined,
    });

    // Create session in DB
    const session = await prisma.interviewSession.create({
      data: {
        studentId: student.id,
        sessionNumber: nextSessionNumber,
        sessionType: finalSessionType,
        targetRole: student.targetRole,
        companyTier: student.targetCompanyTier,
        status: "IN_PROGRESS",
        targetedWeaknessIds: isReInterview ? JSON.stringify(targetedWeaknesses.map((w) => w.id)) : null,
        questions: {
          create: generatedQuestions.map((q, idx) => ({
            questionOrder: q.order || idx + 1,
            category: q.category,
            question: q.question,
            context: q.context,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      session,
      targetedWeaknesses: isReInterview ? targetedWeaknesses : [],
      isReInterview,
    });
  } catch (error: any) {
    console.error("POST /api/interview/start error:", error);
    return NextResponse.json({ error: error.message || "Failed to start interview session" }, { status: 500 });
  }
}
