import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      answerId,
      retryAnswer,
      retryScore,
    } = body;

    if (!answerId || !retryAnswer || retryScore === undefined) {
      return NextResponse.json(
        {
          error: "answerId, retryAnswer and retryScore are required",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.answer.update({
      where: {
        id: answerId,
      },
      data: {
        retryAnswer,
        retryScore: Number(retryScore),
      },
    });

    return NextResponse.json({
      success: true,
      answer: updated,
    });
  } catch (error) {
    console.error("Retry answer error:", error);

    return NextResponse.json(
      {
        error: "Failed to save retry answer",
      },
      { status: 500 }
    );
  }
}