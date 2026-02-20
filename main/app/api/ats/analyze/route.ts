import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
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

    // Prefer uploaded resume over profile when available
    let resumeText: string | null = null;
    const latestUpload = await ResumeUpload.findOne({ userId: clerkUser.id })
      .sort({ createdAt: -1 })
      .lean();
    if (latestUpload?.extractedText) {
      resumeText = latestUpload.extractedText;
    } else if (latestUpload) {
      const parsed = await ParsedResume.findOne({ resumeUploadId: latestUpload._id }).lean();
      if (parsed) {
        const p = parsed as any;
        const parts: string[] = [];
        if (p.name) parts.push(`Name: ${p.name}`);
        if (p.email) parts.push(`Email: ${p.email}`);
        if (p.phone) parts.push(`Phone: ${p.phone}`);
        if (p.skills?.length) parts.push(`Skills: ${p.skills.join(", ")}`);
        (p.workExperience || []).forEach((e: any) => {
          parts.push(`${e.role} at ${e.company} (${e.duration || ""})`);
        });
        (p.education || []).forEach((e: any) => {
          parts.push(`${e.degree} at ${e.institution} (${e.year || ""})`);
        });
        resumeText = parts.join("\n\n") || null;
      }
    }

    const analysis = await runATSAnalysis(clerkUser.id, dbUser, jobId, resumeText);
    if (!analysis) {
      return NextResponse.json(
        { error: "AI provider not configured (set KIMI_K2_API_KEY or GEMINI_API_KEY)" },
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
