/**
 * Generate resume from GitHub profile + repos (user's commits only)
 * No PDF upload needed
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { structureResumeFromGitHub } from "@/lib/ats/resume-structurer";
import { fetchUserCommits } from "@/lib/github";

const GITHUB_API = "https://api.github.com";

function headers() {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HEXjuy-Career-Platform",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
}

async function fetchRepoInfo(owner: string, repo: string) {
  const [metaRes, langRes] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: headers() }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers: headers() }),
  ]);
  const meta = metaRes.ok ? await metaRes.json() : {};
  const langs = langRes.ok ? await langRes.json() : {};
  return {
    name: meta.name,
    description: meta.description || "",
    languages: Object.keys(langs),
  };
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const dbUser = await User.findOne({ userId: user.id }).lean();
    const githubUsername = (dbUser as any)?.githubUsername;

    if (!githubUsername) {
      return NextResponse.json(
        { error: "Connect GitHub first (Settings or onboarding)" },
        { status: 400 }
      );
    }

    // Fetch GitHub profile
    const profileRes = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(githubUsername)}`,
      { headers: headers() }
    );
    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "GitHub user not found" },
        { status: 404 }
      );
    }
    const profile = await profileRes.json();

    // Fetch user's repos from our DB
    const repos = await GitRepo.find({ userId: user.id }).lean();
    const repoDetails: string[] = [];

    for (const r of repos as any[]) {
      const info = await fetchRepoInfo(r.owner, r.repoName);
      const commits = await fetchUserCommits(r.owner, r.repoName, githubUsername, 15);
      const commitSummaries = commits.map((c) => `  - ${c.message.split("\n")[0]}`).join("\n");
      repoDetails.push(
        `Repo: ${r.repoName} (${info.languages.join(", ") || "N/A"})\n` +
          `Description: ${info.description}\n` +
          `My commits:\n${commitSummaries || "  (none)"}`
      );
    }

    const profileText = [
      `GitHub Profile:`,
      `Name: ${profile.name || profile.login}`,
      `Username: ${profile.login}`,
      `Bio: ${profile.bio || "N/A"}`,
      `Location: ${profile.location || "N/A"}`,
      `Email: ${profile.email || "N/A"}`,
      `Public repos: ${profile.public_repos || 0}`,
      `Followers: ${profile.followers || 0}`,
      ``,
      `Repositories and my contributions:`,
      repoDetails.join("\n\n"),
    ].join("\n");

    const structured = await structureResumeFromGitHub(profileText);

    // Merge with Clerk/User data for name/email
    const name = structured.name || `${dbUser?.firstName || ""} ${dbUser?.lastName || ""}`.trim() || profile.name || profile.login;
    const email = structured.email || dbUser?.email || profile.email || user.emailAddresses[0]?.emailAddress || "";

    const hashedName = `github-${user.id}-${Date.now()}`;
    const resumeUpload = await ResumeUpload.create({
      userId: user.id,
      fileName: "github-profile",
      hashedName,
      fileUrl: `https://github.com/${githubUsername}`,
      mimeType: "application/github",
      source: "github",
      extractedText: profileText.slice(0, 5000),
    });

    await ParsedResume.create({
      resumeUploadId: resumeUpload._id,
      name,
      email,
      phone: structured.phone,
      skills: structured.skills,
      workExperience: structured.work_experience,
      education: structured.education,
      totalYearsExperience: structured.total_years_experience,
      rawStructured: structured,
    });

    await User.findOneAndUpdate(
      { userId: user.id },
      {
        $set: {
          skills: structured.skills,
          resumeUrl: `https://github.com/${githubUsername}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      resumeId: resumeUpload._id.toString(),
      structured: {
        name,
        email,
        skills: structured.skills,
        totalYearsExperience: structured.total_years_experience,
      },
      message: "Resume generated from GitHub profile",
    });
  } catch (err) {
    console.error("Generate resume from GitHub error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}