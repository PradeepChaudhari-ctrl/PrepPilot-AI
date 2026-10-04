import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePracticeDrills } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const drills = await prisma.practiceDrill.findMany({
      where: { studentId },
      include: {
        weakness: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drills });
  } catch (error: any) {
    console.error("GET /api/drills error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch drills" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        weaknesses: {
          where: { status: { in: ["ACTIVE", "PRACTICED"] } },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const generatedDrills = await generatePracticeDrills({
      studentName: student.name,
      targetRole: student.targetRole,
      weaknesses: student.weaknesses.map((w) => ({
        id: w.id,
        topic: w.topic,
        description: w.description,
        category: w.category,
      })),
    });

    const createdDrills = [];
    for (const d of generatedDrills) {
      const matchingWeakness = student.weaknesses.find(
        (w) => w.topic.toLowerCase() === d.targetTopic.toLowerCase()
      ) || student.weaknesses[0];

      const created = await prisma.practiceDrill.create({
        data: {
          studentId: student.id,
          weaknessId: matchingWeakness?.id || null,
          drillType: d.drillType,
          title: d.title,
          prompt: d.prompt,
          options: d.options ? JSON.stringify(d.options) : null,
          explanation: d.explanation,
          sampleBestAnswer: d.sampleBestAnswer,
        },
        include: { weakness: true },
      });
      createdDrills.push(created);
    }

    return NextResponse.json({ drills: createdDrills });
  } catch (error: any) {
    console.error("POST /api/drills error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate drills" }, { status: 500 });
  }
}
