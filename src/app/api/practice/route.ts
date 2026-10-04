import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter your email address.",
        },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: {
        email,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No account found with this email. Please register first.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to login right now. Please try again.",
      },
      { status: 500 }
    );
  }
}