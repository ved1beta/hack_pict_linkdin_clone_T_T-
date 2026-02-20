import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { GitAnalysis } from "@/mongodb/models/gitAnalysis";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const repoInfos: { repoName: string; languages: string[]; description?: string }[] = [];
    for (const r of repos as any[]) {
      const info = await fetchRepoInfo(r.owner, r.repoName);
      if (info) {
        repoInfos.push({
          repoName: r.repoName,
          languages: info.languages,
          description: info.description,
        });
      }
    }

    const summary = repoInfos
      .map(
        (r) =>
          `- ${r.repoName}: ${r.languages.join(", ") || "N/A"}${r.description ? ` | ${r.description}` : ""}`
      )
      .join("\n");

    const kimiKey = process.env.KIMI_K2_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!kimiKey && !geminiKey) {
      return NextResponse.json(
        { error: "AI provider not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are a senior developer reviewing a candidate's GitHub portfolio.

REPOSITORIES:
${summary}

Analyze the portfolio and respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "score": number (0-100),
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendation": "string - brief actionable advice"
}

Be constructive. Consider: tech stack diversity, project complexity, documentation, language usage.`;

    let text: string;
    if (kimiKey) {
      const openai = new OpenAI({
        apiKey: kimiKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      const response = await openai.chat.completions.create({
        model: process.env.KIMI_MODEL || "moonshotai/kimi-k2.5",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });
      text = response.choices[0]?.message?.content?.trim() ?? "";
    } else {
      const genAI = new GoogleGenerativeAI(geminiKey!);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }

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
