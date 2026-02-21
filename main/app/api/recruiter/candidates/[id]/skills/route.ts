/**
 * GET /api/recruiter/candidates/[id]/skills
 *
 * Returns a candidate's verified skill breakdown — recruiter-safe view.
 * Recruiters see the display_label and confidence score.
 * Self-reported (LinkedIn-only) skills are marked clearly.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { VerifiedSkill } from "@/mongodb/models/verifiedSkill";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const recruiter = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!recruiter || recruiter.userType !== "recruiter") {
      return NextResponse.json(
        { error: "Recruiter access required" },
        { status: 403 }
      );
    }

    const candidateId = params.id;
    const candidate = await User.findOne({
      userId: candidateId,
      userType: "student",
    })
      .select("userId firstName lastName githubUsername userImage bio location linkedInUrl collegeVerification")
      .lean() as any;

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const skills = await VerifiedSkill.find({ userId: candidateId })
      .sort({ confidenceScore: -1 })
      .lean() as any[];

    // Recruiter view: no improvement tips, no internal evidence details
    const recruiterSkillView = skills.map((s) => ({
      skillName: s.skillName,
      confidenceScore: s.confidenceScore,
      displayLabel: s.displayLabel,
      verified: s.verified,
      // Recruiters see aggregated evidence summary (not raw evidence object)
      evidenceSummary: {
        repoCount: s.evidence.repoCount,
        totalCommits: s.evidence.totalCommits,
        hasProductionProject: s.evidence.hasProductionProject,
        lastUsed: s.evidence.lastUsed,
        strongestRepo: s.evidence.strongestRepo
          ? {
              name: s.evidence.strongestRepo.name,
              stars: s.evidence.strongestRepo.stars,
              hasLiveDemo: s.evidence.strongestRepo.hasLiveDemo,
              description: s.evidence.strongestRepo.description,
            }
          : null,
      },
      // Self-reported means LinkedIn-only with no GitHub evidence
      selfReported: s.source === "linkedin" && !s.verified,
      source: s.source,
      lastUpdated: s.lastUpdated,
    }));

    return NextResponse.json({
      candidate: {
        userId: candidate.userId,
        name: `${candidate.firstName} ${candidate.lastName}`,
        userImage: candidate.userImage,
        bio: candidate.bio,
        location: candidate.location,
        githubUsername: candidate.githubUsername,
        hasLinkedin: !!candidate.linkedInUrl,
        collegeVerified:
          candidate.collegeVerification?.status === "approved",
      },
      skills: recruiterSkillView,
      verifiedCount: recruiterSkillView.filter((s) => s.verified).length,
      selfReportedCount: recruiterSkillView.filter((s) => s.selfReported).length,
    });
  } catch (err) {
    console.error("[recruiter/candidates/[id]/skills] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch candidate skills" },
      { status: 500 }
    );
  }
}
