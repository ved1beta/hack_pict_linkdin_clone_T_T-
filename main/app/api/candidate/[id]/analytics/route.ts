import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { AtsScore } from "@/mongodb/models/atsScore";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { GitAnalysis } from "@/mongodb/models/gitAnalysis";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const candidate = await User.findByUserId(params.id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const [resumeUploads, atsScores, gitRepos, gitAnalysis] = await Promise.all([
      ResumeUpload.find({ userId: params.id }).sort({ createdAt: 1 }).lean(),
      AtsScore.find({ userId: params.id }).sort({ createdAt: -1 }).lean(),
      GitRepo.find({ userId: params.id }).lean(),
      GitAnalysis.findOne({ userId: params.id }).sort({ analyzedAt: -1 }).lean(),
    ]);

    const latestGit = gitAnalysis as any;
    const reposWithLang = (gitRepos as any[]).map((r) => ({
      repoName: r.repoName,
      languages:
        latestGit?.repoSummary?.find((rs: any) => rs.repoName === r.repoName)?.languages || [],
    }));

    return NextResponse.json({
      resumeUploads: resumeUploads.map((u: any) => ({ createdAt: u.createdAt })),
      atsScores: atsScores.map((s: any) => ({ createdAt: s.createdAt, score: s.score })),
      gitRepos: reposWithLang,
      gitAnalysis: latestGit
        ? {
            score: latestGit.score,
            repoSummary: latestGit.repoSummary,
          }
        : null,
    });
  } catch (error) {
    console.error("Candidate analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
