/**
 * GitHub setup: fetch pinned repos, add to GitRepo, optionally generate resume
 * Uses user's commits only for analysis (author=username)
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { fetchPinnedRepos } from "@/lib/github";

async function getGitHubUsernameFromClerk(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const githubAccount = user.externalAccounts?.find(
      (e: any) =>
        e.provider === "oauth_github" || e.provider === "github"
    );
    return githubAccount?.username ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const githubUsername =
      body.githubUsername?.trim() ||
      (await getGitHubUsernameFromClerk(user.id));

    if (!githubUsername) {
      return NextResponse.json(
        {
          error:
            "GitHub username required. Sign in with GitHub or enter your username.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch pinned repos (or top repos if no GraphQL token)
    const pinned = await fetchPinnedRepos(githubUsername);
    const added: { id: string; url: string; repoName: string; owner: string }[] = [];

    for (const p of pinned) {
      const url = p.url.startsWith("http") ? p.url : `https://github.com/${p.owner}/${p.repo}`;
      const existing = await GitRepo.findOne({
        userId: user.id,
        url,
      });
      if (!existing) {
        const repo = await GitRepo.create({
          userId: user.id,
          url,
          repoName: p.repo,
          owner: p.owner,
        });
        added.push({
          id: repo._id.toString(),
          url,
          repoName: p.repo,
          owner: p.owner,
        });
      }
    }

    // Update user with githubUsername
    await User.findOneAndUpdate(
      { userId: user.id },
      { $set: { githubUsername } },
      { upsert: false }
    );

    return NextResponse.json({
      success: true,
      githubUsername,
      addedRepos: added.length,
      repos: added,
      message: `Connected GitHub. Added ${added.length} pinned repo(s).`,
    });
  } catch (err) {
    console.error("GitHub setup error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Setup failed" },
      { status: 500 }
    );
  }
}