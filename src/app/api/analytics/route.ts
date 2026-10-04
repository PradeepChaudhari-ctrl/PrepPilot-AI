import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        interviews: {
          where: { status: "COMPLETED" },
          orderBy: { sessionNumber: "asc" },
          include: {
            questions: true,
          },
        },
        weaknesses: {
          orderBy: { createdAt: "desc" },
        },
        drills: true,
        scoreHistories: {
          orderBy: { sessionNumber: "asc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const completedInterviews = student.interviews;
    const latestInterview = completedInterviews[completedInterviews.length - 1] || null;
    const initialInterview = completedInterviews[0] || null;

    // Progression data for Recharts
    const trendData = completedInterviews.map((iv) => ({
      sessionName: iv.sessionNumber === 1 ? "Diagnostic" : `Re-Interview #${iv.sessionNumber - 1}`,
      sessionNumber: iv.sessionNumber,
      overall: iv.overallScore || 0,
      technical: iv.techScore || 0,
      communication: iv.communicationScore || 0,
      problemSolving: iv.problemSolvingScore || 0,
      starMethod: iv.starMethodScore || 0,
      delta: iv.improvementDelta || 0,
      date: new Date(iv.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    }));

    // Radar chart data for latest session vs baseline
    const radarData = [
      {
        subject: "Technical Depth",
        baseline: initialInterview?.techScore || 0,
        current: latestInterview?.techScore || 0,
        fullMark: 100,
      },
      {
        subject: "Communication",
        baseline: initialInterview?.communicationScore || 0,
        current: latestInterview?.communicationScore || 0,
        fullMark: 100,
      },
      {
        subject: "Problem Solving",
        baseline: initialInterview?.problemSolvingScore || 0,
        current: latestInterview?.problemSolvingScore || 0,
        fullMark: 100,
      },
      {
        subject: "STAR Method",
        baseline: initialInterview?.starMethodScore || 0,
        current: latestInterview?.starMethodScore || 0,
        fullMark: 100,
      },
    ];

    // Weakness stats
    const totalWeaknesses = student.weaknesses.length;
    const resolvedWeaknesses = student.weaknesses.filter((w) => w.status === "RESOLVED").length;
    const practicedWeaknesses = student.weaknesses.filter((w) => w.status === "PRACTICED").length;
    const activeWeaknesses = student.weaknesses.filter((w) => w.status === "ACTIVE").length;

    // Improvement calculation
    const totalDelta =
      completedInterviews.length > 1 && initialInterview?.overallScore && latestInterview?.overallScore
        ? Number((latestInterview.overallScore - initialInterview.overallScore).toFixed(1))
        : 0;

    return NextResponse.json({
      summary: {
        totalInterviews: completedInterviews.length,
        latestScore: latestInterview?.overallScore || 0,
        initialScore: initialInterview?.overallScore || 0,
        totalDelta,
        readinessLevel: latestInterview?.readinessLevel || "Not Started",
        weaknessStats: {
          total: totalWeaknesses,
          resolved: resolvedWeaknesses,
          practiced: practicedWeaknesses,
          active: activeWeaknesses,
          resolutionRate: totalWeaknesses > 0 ? Math.round((resolvedWeaknesses / totalWeaknesses) * 100) : 0,
        },
      },
      trendData,
      radarData,
      weaknesses: student.weaknesses,
      recentInterviews: completedInterviews.slice().reverse(),
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
