import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateInterviewSession, generatePracticeDrills } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, answers } = body as {
      sessionId: string;
      answers: Array<{ questionId: string; userAnswer: string; audioDurationSec?: number }>;
    };

    if (!sessionId || !answers) {
      return NextResponse.json({ error: "sessionId and answers are required" }, { status: 400 });
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
        },
        student: {
          include: {
            weaknesses: {
              where: { status: { in: ["ACTIVE", "PRACTICED"] } },
            },
            interviews: {
              where: { status: "COMPLETED" },
              orderBy: { sessionNumber: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 1. Update each question's userAnswer in DB
    for (const item of answers) {
      await prisma.questionAnswer.update({
        where: { id: item.questionId },
        data: {
          userAnswer: item.userAnswer,
          audioDurationSec: item.audioDurationSec || 0,
        },
      });
    }

    // 2. Prepare payload for evaluation
    const questionsAndAnswers = session.questions.map((q) => {
      const submitted = answers.find((a) => a.questionId === q.id);
      return {
        order: q.questionOrder,
        category: q.category,
        question: q.question,
        userAnswer: submitted ? submitted.userAnswer : q.userAnswer || "",
      };
    });

    const previousInterview = session.student.interviews[0];
    const previousScore = previousInterview?.overallScore || undefined;

    const targetedWeaknesses = session.student.weaknesses.map((w) => ({
      topic: w.topic,
      description: w.description,
      category: w.category,
    }));

    // 3. AI Evaluation
    const evaluation = await evaluateInterviewSession({
      studentName: session.student.name,
      targetRole: session.targetRole,
      companyTier: session.companyTier,
      sessionType: session.sessionType as "DIAGNOSTIC" | "RE_INTERVIEW",
      questionsAndAnswers,
      targetedWeaknesses: session.sessionType === "RE_INTERVIEW" ? targetedWeaknesses : undefined,
      previousScore: previousScore || undefined,
    });

    // 4. Update each question with AI feedback & better answers
    for (const qEval of evaluation.questionEvaluations) {
      const q = session.questions.find((sq) => sq.questionOrder === qEval.order);
      if (q) {
        await prisma.questionAnswer.update({
          where: { id: q.id },
          data: {
            score: qEval.score,
            feedback: qEval.feedback,
            betterAnswer: qEval.betterAnswer,
            weaknessIdentified: qEval.weaknessIdentified || null,
            keyStrengths: qEval.keyStrengths,
          },
        });
      }
    }

    // 5. Handle Weaknesses & Drills based on session type
    let improvementDelta: number | null = null;
    let newlyCreatedWeaknesses: any[] = [];
    let resolvedWeaknesses: any[] = [];

    if (session.sessionType === "DIAGNOSTIC") {
      // Create new weaknesses
      if (evaluation.identifiedWeaknesses && evaluation.identifiedWeaknesses.length > 0) {
        for (const w of evaluation.identifiedWeaknesses) {
          const created = await prisma.weakness.create({
            data: {
              studentId: session.studentId,
              category: w.category,
              topic: w.topic,
              description: w.description,
              severity: w.severity,
              status: "ACTIVE",
              identifiedInSessionId: session.id,
            },
          });
          newlyCreatedWeaknesses.push(created);
        }

        // Generate immediate Practice Drills targeting these weaknesses
        const generatedDrills = await generatePracticeDrills({
          studentName: session.student.name,
          targetRole: session.targetRole,
          weaknesses: newlyCreatedWeaknesses.map((w) => ({
            id: w.id,
            topic: w.topic,
            description: w.description,
            category: w.category,
          })),
        });

        for (const drill of generatedDrills) {
          const matchingWeakness = newlyCreatedWeaknesses.find(
            (w) => w.topic.toLowerCase() === drill.targetTopic.toLowerCase()
          ) || newlyCreatedWeaknesses[0];

          await prisma.practiceDrill.create({
            data: {
              studentId: session.studentId,
              weaknessId: matchingWeakness?.id || null,
              drillType: drill.drillType,
              title: drill.title,
              prompt: drill.prompt,
              options: drill.options ? JSON.stringify(drill.options) : null,
              explanation: drill.explanation,
              sampleBestAnswer: drill.sampleBestAnswer,
            },
          });
        }
      }
    } else if (session.sessionType === "RE_INTERVIEW") {
      // Calculate improvement delta
      if (previousScore !== undefined) {
        improvementDelta = Number((evaluation.overallScore - previousScore).toFixed(1));
      }

      // Mark resolved weaknesses
      if (evaluation.resolvedWeaknessTopics && evaluation.resolvedWeaknessTopics.length > 0) {
        for (const topic of evaluation.resolvedWeaknessTopics) {
          const matched = session.student.weaknesses.find(
            (w) => w.topic.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(w.topic.toLowerCase())
          );
          if (matched) {
            const updated = await prisma.weakness.update({
              where: { id: matched.id },
              data: {
                status: "RESOLVED",
                resolvedInSessionId: session.id,
              },
            });
            resolvedWeaknesses.push(updated);
          }
        }
      }
    }

    // 6. Record Score History
    await prisma.scoreHistory.create({
      data: {
        studentId: session.studentId,
        sessionId: session.id,
        sessionNumber: session.sessionNumber,
        overallScore: evaluation.overallScore,
        techScore: evaluation.techScore,
        communicationScore: evaluation.communicationScore,
        problemSolvingScore: evaluation.problemSolvingScore,
        starMethodScore: evaluation.starMethodScore,
        deltaFromPrevious: improvementDelta,
      },
    });

    // 7. Update Session Status to COMPLETED
    const updatedSession = await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        overallScore: evaluation.overallScore,
        techScore: evaluation.techScore,
        communicationScore: evaluation.communicationScore,
        problemSolvingScore: evaluation.problemSolvingScore,
        starMethodScore: evaluation.starMethodScore,
        feedbackSummary: evaluation.feedbackSummary,
        readinessLevel: evaluation.readinessLevel,
        improvementDelta,
      },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      session: updatedSession,
      evaluation,
      improvementDelta,
      newlyCreatedWeaknesses,
      resolvedWeaknesses,
    });
  } catch (error: any) {
    console.error("POST /api/interview/submit error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit interview" }, { status: 500 });
  }
}
