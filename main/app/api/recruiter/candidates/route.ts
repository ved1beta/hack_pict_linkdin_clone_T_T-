/**
 * GET /api/recruiter/candidates
 *
 * List candidates with advanced filtering on verified skills.
 * Only accessible to users with userType === "recruiter".
 *
 * Query parameters:
 *   minConfidenceScore  - number (0–100): minimum confidence score for ANY matched skill
 *   skills[]            - string[]: AND logic — candidate must have all listed skills verified
 *   hasProductionProject- boolean: candidate has at least one skill with a production project
 *   minCommits          - number: minimum total commits across all skills
 *   lastActiveWithinDays- number: GitHub last commit within N days
 *   hasLinkedin         - boolean: LinkedIn profile exists for this candidate
 *   verifiedSkillsOnly  - boolean: only return candidates with at least one verified skill
 *   sortBy              - "confidenceScore" | "lastActive" | "totalCommits" (default: confidenceScore)
 *   sortSkill           - string: sort by confidence score for a specific skill
 *   page                - number (default: 1)
 *   limit               - number (default: 20, max: 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { VerifiedSkill } from "@/mongodb/models/verifiedSkill";
import { LinkedInProfile } from "@/mongodb/models/linkedInProfile";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const dbUser = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!dbUser || dbUser.userType !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can access candidate listings" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const minConfidenceScore = parseInt(searchParams.get("minConfidenceScore") || "0");
    const skills = searchParams.getAll("skills[]").filter(Boolean);
    const hasProductionProject = searchParams.get("hasProductionProject") === "true";
    const minCommits = parseInt(searchParams.get("minCommits") || "0");
    const lastActiveWithinDays = parseInt(searchParams.get("lastActiveWithinDays") || "0");
    const hasLinkedin = searchParams.get("hasLinkedin") === "true";
    const verifiedSkillsOnly = searchParams.get("verifiedSkillsOnly") !== "false";
    const sortSkill = searchParams.get("sortSkill") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // ---------------------------------------------------------------------------
    // Step 1: Build skill query to find qualifying userIds
    // ---------------------------------------------------------------------------

    // We always query VerifiedSkill collection since it's the source of truth
    const skillQuery: Record<string, unknown> = {};

    if (verifiedSkillsOnly) {
      skillQuery.verified = true;
    }
    if (minConfidenceScore > 0) {
      skillQuery.confidenceScore = { $gte: minConfidenceScore };
    }
    if (hasProductionProject) {
      skillQuery["evidence.hasProductionProject"] = true;
    }
    if (minCommits > 0) {
      skillQuery["evidence.totalCommits"] = { $gte: minCommits };
    }

    // Get userIds that meet per-skill criteria
    let qualifyingUserIds: string[] = [];

    if (skills.length > 0) {
      // AND logic: candidate must have ALL specified skills meeting the criteria
      // Find users who have each required skill, then intersect
      const userIdSets = await Promise.all(
        skills.map(async (skill) => {
          const docs = await VerifiedSkill.distinct("userId", {
            ...skillQuery,
            skillName: { $regex: new RegExp(`^${skill}$`, "i") },
          });
          return new Set(docs as string[]);
        })
      );

      // Intersection of all sets
      if (userIdSets.length > 0) {
        qualifyingUserIds = [...userIdSets[0]].filter((uid) =>
          userIdSets.every((s) => s.has(uid))
        );
      }
    } else {
      // No skill filter — get all users with any skill meeting base criteria
      qualifyingUserIds = await VerifiedSkill.distinct("userId", skillQuery) as string[];
    }

    if (qualifyingUserIds.length === 0) {
      return NextResponse.json({
        candidates: [],
        total: 0,
        page,
        totalPages: 0,
      });
    }

    // ---------------------------------------------------------------------------
    // Step 2: Apply user-level filters
    // ---------------------------------------------------------------------------

    const userQuery: Record<string, unknown> = {
      userId: { $in: qualifyingUserIds },
      userType: "student",
    };

    if (lastActiveWithinDays > 0) {
      const cutoff = new Date(
        Date.now() - lastActiveWithinDays * 24 * 60 * 60 * 1000
      );
      userQuery.lastGithubSynced = { $gte: cutoff };
    }

    // LinkedIn filter: cross-reference the LinkedInProfile collection
    if (hasLinkedin) {
      const linkedinUserIds = await LinkedInProfile.distinct("userId", {
        userId: { $in: qualifyingUserIds },
      }) as string[];
      userQuery.userId = { $in: linkedinUserIds };
    }

    const totalCount = await User.countDocuments(userQuery);

    const candidates = await User.find(userQuery)
      .select(
        "userId firstName lastName email userImage bio githubUsername linkedInUrl collegeVerification location skills"
      )
      .lean()
      .skip(skip)
      .limit(limit) as any[];

    // ---------------------------------------------------------------------------
    // Step 3: Enrich each candidate with skill summary (recruiter view)
    // ---------------------------------------------------------------------------

    const candidateIds = candidates.map((c) => c.userId);

    // Fetch top 5 skills per candidate (recruiter sees display_label only)
    const allSkills = await VerifiedSkill.find({
      userId: { $in: candidateIds },
      verified: true,
    })
      .sort({ confidenceScore: -1 })
      .select("userId skillName confidenceScore displayLabel source evidence.hasProductionProject")
      .lean() as any[];

    const skillsByUser = new Map<string, any[]>();
    for (const skill of allSkills) {
      const list = skillsByUser.get(skill.userId) || [];
      list.push(skill);
      skillsByUser.set(skill.userId, list);
    }

    // Compute sort score for each candidate (for sortSkill param)
    const enriched = candidates.map((candidate) => {
      const userSkills = skillsByUser.get(candidate.userId) || [];

      // For sortSkill: find that specific skill's confidence score
      let sortScore = 0;
      if (sortSkill) {
        const targetSkill = userSkills.find(
          (s) => s.skillName.toLowerCase() === sortSkill.toLowerCase()
        );
        sortScore = targetSkill?.confidenceScore || 0;
      } else {
        // Default: average of top 3 skills
        const top3 = userSkills.slice(0, 3);
        sortScore =
          top3.length > 0
            ? top3.reduce((s, sk) => s + sk.confidenceScore, 0) / top3.length
            : 0;
      }

      return {
        userId: candidate.userId,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        userImage: candidate.userImage,
        bio: candidate.bio,
        location: candidate.location,
        githubUsername: candidate.githubUsername,
        hasLinkedin: !!candidate.linkedInUrl,
        collegeVerified:
          candidate.collegeVerification?.status === "approved",
        collegeName: candidate.collegeVerification?.collegeName,
        // Recruiter-safe skill view: display_label + confidence score only
        topSkills: userSkills.slice(0, 5).map((s) => ({
          skillName: s.skillName,
          confidenceScore: s.confidenceScore,
          displayLabel: s.displayLabel,
          // Mark self-reported skills visually distinct
          selfReported: s.source === "linkedin",
        })),
        sortScore,
      };
    });

    // Sort by sortScore descending
    enriched.sort((a, b) => b.sortScore - a.sortScore);

    return NextResponse.json({
      candidates: enriched,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("[recruiter/candidates] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
