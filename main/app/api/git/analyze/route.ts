import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { GitAnalysis } from "@/mongodb/models/gitAnalysis";
import { User } from "@/mongodb/models/user";
import { fetchUserCommits } from "@/lib/github";
import { chatWithClaude } from "@/lib/localClaude";

async function fetchRepoInfo(owner: string, repo: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "HEXjuy-Career-Platform",
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const langRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/languages`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "HEXjuy-Career-Platform",
      },
    }
  );
  const languages = langRes.ok ? await langRes.json() : {};
  return {
    name: data.name,
    description: data.description || "",
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    languages: Object.keys(languages),
    readme: "", // Could fetch README separately if needed
  };
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const repos = await GitRepo.find({ userId: user.id }).lean();
    if (repos.length === 0) {
      return NextResponse.json(
        { error: "Add GitHub repos in Settings first" },
        { status: 400 }
      );
    }

    const dbUser = await User.findOne({ userId: user.id }).lean();
    const githubUsername = (dbUser as any)?.githubUsername;

    const settled = await Promise.allSettled(
      (repos as any[]).map(async (r) => {
        const [info, commits] = await Promise.all([
          fetchRepoInfo(r.owner, r.repoName),
          githubUsername
            ? fetchUserCommits(r.owner, r.repoName, githubUsername, 10)
            : Promise.resolve([]),
        ]);
        if (!info) return null;
        return {
          repoName: r.repoName,
          languages: info.languages,
          description: info.description,
          myCommits: commits.map((c) => c.message.split("\n")[0]),
        };
      })
    );
    const repoInfos = settled
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    const summary = repoInfos
      .map(
        (r) =>
          `- ${r.repoName}: ${r.languages.join(", ") || "N/A"}${r.description ? ` | ${r.description}` : ""}` +
          (r.myCommits?.length ? `\n  My commits: ${r.myCommits.slice(0, 5).join("; ")}` : "")
      )
      .join("\n");

    const systemPrompt = `You are a senior developer reviewing a candidate's GitHub portfolio.
The "My commits" shown are ONLY this candidate's commits (filtered by author). Other contributors' work is excluded.
Be constructive. Consider: tech stack diversity, project complexity, documentation, language usage.`;

    const userPrompt = `REPOSITORIES:
${summary}

Analyze the portfolio and respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "score": number (0-100),
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendation": "string - brief actionable advice"
}`;

    // Use local Groq for GitHub analysis
    const text = await chatWithClaude([
      { role: "user", content: userPrompt }
    ], systemPrompt);

    const jsonMatch = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonMatch);

    const analysis = await GitAnalysis.create({
      userId: user.id,
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      recommendation: parsed.recommendation || "Keep building!",
      repoSummary: repoInfos,
    });

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis._id.toString(),
        score: analysis.score,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        recommendation: analysis.recommendation,
        repoSummary: analysis.repoSummary,
        analyzedAt: analysis.analyzedAt,
      },
    });
  } catch (err) {
    console.error("Git analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
