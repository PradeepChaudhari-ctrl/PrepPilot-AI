import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Interview GET error:", error);

    return NextResponse.json(
      { error: "Failed to load interview" },
      { status: 500 }
    );
  }
}