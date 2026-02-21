/**
 * GET /api/profile/skills
 *
 * Returns the authenticated user's verified skills with full evidence breakdowns
 * and improvement tips. Candidates see their own complete data including tips
 * for improving each skill's confidence score.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { VerifiedSkill } from "@/mongodb/models/verifiedSkill";
import { generateImprovementTips } from "@/lib/skillVerification";

export async function GET(): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const skills = await VerifiedSkill.find({ userId: clerkUser.id })
      .sort({ confidenceScore: -1 })
      .lean() as any[];

    const enriched = skills.map((skill) => ({
      skillName: skill.skillName,
      verified: skill.verified,
      confidenceScore: skill.confidenceScore,
      displayLabel: skill.displayLabel,
      source: skill.source,
      lastUpdated: skill.lastUpdated,
      verifiedAt: skill.verifiedAt,
      evidence: {
        repoCount: skill.evidence.repoCount,
        totalCommits: skill.evidence.totalCommits,
        starsOnSkillRepos: skill.evidence.starsOnSkillRepos,
        hasProductionProject: skill.evidence.hasProductionProject,
        languagesPercentage: skill.evidence.languagesPercentage,
        lastUsed: skill.evidence.lastUsed,
        strongestRepo: skill.evidence.strongestRepo,
      },
      // Improvement tips — only visible to the candidate themselves
      improvementTips: generateImprovementTips(
        skill.skillName,
        skill.evidence,
        skill.confidenceScore
      ),
    }));

    // Group: verified (GitHub evidence) vs self-reported (LinkedIn only)
    const verified = enriched.filter((s) => s.verified && s.source !== "linkedin");
    const selfReported = enriched.filter((s) => s.source === "linkedin" && !s.verified);
    const unverifiedGithub = enriched.filter(
      (s) => !s.verified && s.source !== "linkedin"
    );

    return NextResponse.json({
      total: skills.length,
      verified,
      selfReported,
      unverifiedGithub,
    });
  } catch (err) {
    console.error("[profile/skills] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
