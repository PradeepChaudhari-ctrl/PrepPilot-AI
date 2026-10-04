import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json({ error: "Student ID or Email is required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: id ? { id } : { email: email! },
      include: {
        interviews: {
          orderBy: { createdAt: "desc" },
          include: {
            questions: {
              orderBy: { questionOrder: "asc" },
            },
          },
        },
        weaknesses: {
          orderBy: { createdAt: "desc" },
        },
        drills: {
          orderBy: { createdAt: "desc" },
          include: {
            weakness: true,
          },
        },
        scoreHistories: {
          orderBy: { sessionNumber: "asc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error: any) {
    console.error("GET /api/student error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, college, branch, gradYear, targetRole, targetCompanyTier, resumeText, resumeFileName } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
    }

    const student = await prisma.student.upsert({
      where: { email },
      update: {
        name,
        college: college || null,
        branch: branch || null,
        gradYear: gradYear || null,
        targetRole: targetRole || "Software Development Engineer (SDE)",
        targetCompanyTier: targetCompanyTier || "Tier 1 Product",
        resumeText: resumeText || undefined,
        resumeFileName: resumeFileName || undefined,
      },
      create: {
        name,
        email,
        college: college || null,
        branch: branch || null,
        gradYear: gradYear || null,
        targetRole: targetRole || "Software Development Engineer (SDE)",
        targetCompanyTier: targetCompanyTier || "Tier 1 Product",
        resumeText: resumeText || null,
        resumeFileName: resumeFileName || null,
      },
      include: {
        interviews: true,
        weaknesses: true,
      },
    });

    return NextResponse.json({ student });
  } catch (error: any) {
    console.error("POST /api/student error:", error);
    return NextResponse.json({ error: error.message || "Failed to save student profile" }, { status: 500 });
  }
}
