/**
 * List user's uploaded resumes and their ATS scores
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { AtsScore } from "@/mongodb/models/atsScore";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resumes = await ResumeUpload.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    const resumesWithDetails = await Promise.all(
      resumes.map(async (r) => {
        const parsed = await ParsedResume.findOne({
          resumeUploadId: r._id,
        }).lean();
        const scores = await AtsScore.find({
          resumeUploadId: r._id,
        }).lean();

        return {
          id: r._id.toString(),
          fileName: r.fileName,
          fileUrl: r.fileUrl,
          createdAt: r.createdAt,
          parsed: parsed
            ? {
                name: parsed.name,
                email: parsed.email,
                skills: parsed.skills,
                totalYearsExperience: parsed.totalYearsExperience,
              }
            : null,
          scores: scores.map((s) => ({
            jobId: s.jobId,
            score: s.score,
            breakdown: s.breakdown,
            createdAt: s.createdAt,
          })),
        };
      })
    );

    return NextResponse.json({
      resumes: resumesWithDetails,
    });
  } catch (err) {
    console.error("List resumes error:", err);
    return NextResponse.json(
      { error: "Failed to list resumes" },
      { status: 500 }
    );
  }
}
