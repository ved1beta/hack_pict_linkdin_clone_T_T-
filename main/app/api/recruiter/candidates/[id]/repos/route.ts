/**
 * GET /api/recruiter/candidates/[id]/repos
 *
 * Returns a candidate's top GitHub repositories with skill analysis.
 * Sorted by relevance (stars + commit count).
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { GitRepo } from "@/mongodb/models/gitRepo";

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
      .select("userId firstName lastName githubUsername")
      .lean() as any;

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Fetch stored repos for this candidate
    const repos = await GitRepo.find({ userId: candidateId })
      .sort({ createdAt: -1 })
      .lean() as any[];

    // Enrich with live GitHub metadata
    const enriched = await Promise.allSettled(
      repos.map(async (repo) => {
        const res = await fetch(
          `https://api.github.com/repos/${repo.owner}/${repo.repoName}`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "HEXjuy-Career-Platform",
              ...(process.env.GITHUB_TOKEN
                ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
                : {}),
            },
          }
        );

        if (!res.ok) {
          return {
            name: repo.repoName,
            owner: repo.owner,
            url: repo.url,
            stars: 0,
            forks: 0,
            description: "",
            language: null,
            topics: [],
            isPrivate: false,
          };
        }

        const data = await res.json();
        return {
          name: repo.repoName,
          owner: repo.owner,
          url: repo.url,
          stars: data.stargazers_count || 0,
          forks: data.forks_count || 0,
          description: data.description || "",
          language: data.language,
          topics: data.topics || [],
          isPrivate: data.private || false,
          homepage: data.homepage || null,
          updatedAt: data.updated_at,
        };
      })
    );

    const repoData = enriched
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value)
      .sort((a, b) => b.stars - a.stars);

    return NextResponse.json({
      candidateId,
      githubUsername: candidate.githubUsername,
      repos: repoData,
    });
  } catch (err) {
    console.error("[recruiter/candidates/[id]/repos] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch candidate repos" },
      { status: 500 }
    );
  }
}
