import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json(
        { error: "Student ID or Email is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: id ? { id } : { email: email! },
      include: {
        interviews: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            answers: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        topicProgress: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error: any) {
    console.error("GET /api/student error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch student",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      branch,
      year,
      skills,
      skillsJson,
      targetMode,
      companyStyle,
      languageMode,
      targetRole,
      resumeText,
      resumeAnalysis,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and Email are required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.upsert({
      where: {
        email,
      },

      update: {
        name,
        branch: branch || null,
        year: year ? Number(year) : null,
        skillsJson:
          skillsJson ||
          (Array.isArray(skills) ? JSON.stringify(skills) : null),
        targetMode: targetMode || null,
        companyStyle: companyStyle || null,
        languageMode: languageMode || "English",
        targetRole: targetRole || null,
        resumeText: resumeText || null,
        resumeAnalysisJson: resumeAnalysis
          ? JSON.stringify(resumeAnalysis)
          : null,
      },

      create: {
        name,
        email,
        branch: branch || null,
        year: year ? Number(year) : null,
        skillsJson:
          skillsJson ||
          (Array.isArray(skills) ? JSON.stringify(skills) : null),
        targetMode: targetMode || null,
        companyStyle: companyStyle || null,
        languageMode: languageMode || "English",
        targetRole: targetRole || null,
        resumeText: resumeText || null,
        resumeAnalysisJson: resumeAnalysis
          ? JSON.stringify(resumeAnalysis)
          : null,
      },

      include: {
        interviews: true,
        topicProgress: true,
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error: any) {
    console.error("POST /api/student error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to save student profile",
      },
      { status: 500 }
    );
  }
}