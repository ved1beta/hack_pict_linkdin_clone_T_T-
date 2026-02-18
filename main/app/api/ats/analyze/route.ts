import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { runATSAnalysis } from "@/lib/ats";

export async function POST(request: Request) {
  try {
    await connectDB();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await User.findByUserId(clerkUser.id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { jobId } = await request.json().catch(() => ({}));

    const analysis = await runATSAnalysis(clerkUser.id, dbUser, jobId);
    if (!analysis) {
      return NextResponse.json(
        { error: "Gemini API not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("ATS analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
