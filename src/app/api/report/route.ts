import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReportData } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: "interviewId is required" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        student: true,
        answers: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    const answers = interview.answers.map((answer) => ({
      question: answer.question,
      answer: answer.answer || "",
      topic: answer.topic || "General",
      score: answer.score || 0,
      breakdown: answer.breakdownJson
        ? JSON.parse(answer.breakdownJson)
        : {},
      feedback: answer.feedbackJson
        ? JSON.parse(answer.feedbackJson)
        : {},
      round: answer.round,
    }));

    const previousInterviews = await prisma.interview.findMany({
      where: {
        studentId: interview.studentId,
        id: {
          not: interview.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const report = await generateReportData({
      answers,
      resumeData: interview.student.resumeAnalysisJson
        ? JSON.parse(interview.student.resumeAnalysisJson)
        : null,
      previousTopicScores: {},
    });

    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        overallScore: report.readinessScore,
        reportJson: JSON.stringify(report),
      },
    });

    // Keep TopicProgress as history rows.
    for (const topic of report.topicScores) {
      await prisma.topicProgress.create({
        data: {
          studentId: interview.studentId,
          topic: topic.topic,
          score: topic.score,
        },
      });
    }

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      report,
    });
  } catch (error) {
    console.error("Report generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate interview report",
      },
      { status: 500 }
    );
  }
}