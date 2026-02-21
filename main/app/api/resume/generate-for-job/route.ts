/**
 * Generate a tailored resume for a specific job from:
 * - User's GitHub data (repos, commits, languages)
 * - User's LinkedIn profile text
 * - User's existing parsed resume
 * - Job description & requirements
 */
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { GitRepo } from "@/mongodb/models/gitRepo";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { Job } from "@/mongodb/models/job";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GITHUB_API = "https://api.github.com";

function ghHeaders() {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "HEXjuy-Career-Platform",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function fetchRepoSnapshot(owner: string, repo: string, username: string) {
  const [metaRes, langRes, commitRes] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: ghHeaders() }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers: ghHeaders() }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?author=${encodeURIComponent(username)}&per_page=10`, {
      headers: ghHeaders(),
    }),
  ]);
  const meta = metaRes.ok ? await metaRes.json() : {};
  const langs = langRes.ok ? await langRes.json() : {};
  const commits = commitRes.ok ? await commitRes.json() : [];
  return {
    name: repo,
    description: meta.description || "",
    stars: meta.stargazers_count || 0,
    languages: Object.keys(langs),
    myCommits: Array.isArray(commits)
      ? commits.slice(0, 8).map((c: any) => c.commit?.message?.split("\n")[0] || "")
      : [],
  };
}

async function buildUserProfile(clerkUserId: string): Promise<string> {
  await connectDB();
  const dbUser = (await User.findOne({ userId: clerkUserId }).lean()) as any;
  if (!dbUser) return "";

  const parts: string[] = [];

  // Basic info
  parts.push(`Name: ${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim());
  if (dbUser.email) parts.push(`Email: ${dbUser.email}`);
  if (dbUser.location) parts.push(`Location: ${dbUser.location}`);
  if (dbUser.bio) parts.push(`Bio: ${dbUser.bio}`);

  // LinkedIn text (most important for experience/education)
  if (dbUser.linkedInText?.trim()) {
    parts.push("\n--- LinkedIn Profile ---");
    parts.push(dbUser.linkedInText.trim());
  }

  // Skills from profile
  if (dbUser.skills?.length) {
    parts.push(`\nProfile Skills: ${dbUser.skills.join(", ")}`);
  }

  // Existing parsed resume (uploaded PDF or GitHub-generated)
  const latestUpload = await ResumeUpload.findOne({ userId: clerkUserId })
    .sort({ createdAt: -1 })
    .lean() as any;
  if (latestUpload) {
    const parsed = await ParsedResume.findOne({ resumeUploadId: latestUpload._id }).lean() as any;
    if (parsed) {
      parts.push("\n--- Existing Resume Data ---");
      if (parsed.skills?.length) parts.push(`Skills: ${parsed.skills.join(", ")}`);
      if (parsed.workExperience?.length) {
        parts.push("Work Experience:");
        parsed.workExperience.forEach((w: any) => {
          parts.push(`  ${w.role} at ${w.company} (${w.duration || ""})`);
        });
      }
      if (parsed.education?.length) {
        parts.push("Education:");
        parsed.education.forEach((e: any) => {
          parts.push(`  ${e.degree} - ${e.institution} (${e.year || ""})`);
        });
      }
      if (parsed.totalYearsExperience) {
        parts.push(`Total Experience: ${parsed.totalYearsExperience} years`);
      }
    } else if (latestUpload.extractedText) {
      parts.push("\n--- Uploaded Resume ---");
      parts.push(latestUpload.extractedText.slice(0, 3000));
    }
  }

  // GitHub repos
  if (dbUser.githubUsername) {
    const repos = await GitRepo.find({ userId: clerkUserId }).lean();
    if (repos.length > 0) {
      parts.push("\n--- GitHub Repositories ---");
      for (const r of repos as any[]) {
        const snap = await fetchRepoSnapshot(r.owner, r.repoName, dbUser.githubUsername);
        parts.push(
          `Repo: ${snap.name}${snap.description ? ` – ${snap.description}` : ""}\n` +
          `  Languages: ${snap.languages.join(", ") || "N/A"}\n` +
          `  My commits: ${snap.myCommits.slice(0, 4).join("; ") || "none"}`
        );
      }
    }
  }

  return parts.join("\n");
}

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json().catch(() => ({}));

    await connectDB();

    // Fetch job details
    let jobDetails = "";
    let jobTitle = "the role";
    let jobSkills: string[] = [];
    if (jobId) {
      const job = await Job.findById(jobId).lean() as any;
      if (job) {
        jobTitle = job.title;
        jobSkills = job.skills || [];
        jobDetails = [
          `Job Title: ${job.title}`,
          `Company: ${job.companyName}`,
          `Description: ${job.description}`,
          `Requirements: ${(job.requirements || []).join(", ")}`,
          `Required Skills: ${(job.skills || []).join(", ")}`,
          `Experience Level: ${job.experienceLevel || "entry"}`,
        ].join("\n");
      }
    }

    const userProfile = await buildUserProfile(clerkUser.id);

    const prompt = `You are a professional resume writer and career coach. Create a tailored, ATS-optimized resume for this candidate based on their profile and the target job.

CANDIDATE PROFILE (GitHub + LinkedIn + existing resume):
${userProfile}

${jobId ? `TARGET JOB:\n${jobDetails}\n` : ""}

Write a complete, well-formatted resume in plain text (no JSON, no markdown headers with #). Include:
- Contact info (name, email)
- Professional Summary (2-3 sentences tailored to the role)
- Skills section (highlight skills matching the job)
- Work Experience / Projects (most relevant first)
- Education
- GitHub Projects (use the repo data as project entries)

Rules:
- Tailor the content specifically to ${jobTitle}
- Highlight skills matching: ${jobSkills.slice(0, 10).join(", ")}
- Use action verbs (built, developed, implemented, designed, led)
- Keep it concise but impactful
- If GitHub repos show relevant work, include them as projects
- DO NOT fabricate experience. Only use what's in the profile.`;

    const kimiKey = process.env.KIMI_K2_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let resumeText = "";

    // Use Gemini first (faster) then fall back to Kimi
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      resumeText = result.response.text().trim();
    } else if (kimiKey) {
      const openai = new OpenAI({
        apiKey: kimiKey,
        baseURL: process.env.KIMI_BASE_URL || "https://integrate.api.nvidia.com/v1",
      });
      const response = await openai.chat.completions.create({
        model: process.env.KIMI_MODEL || "moonshotai/kimi-k2.5",
        messages: [
          { role: "system", content: "You write professional, ATS-optimized resumes. Output plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });
      resumeText = response.choices[0]?.message?.content?.trim() || "";
    } else {
      return NextResponse.json({ error: "AI provider not configured" }, { status: 500 });
    }

    return NextResponse.json({ success: true, resumeText, jobTitle });
  } catch (err) {
    console.error("Generate for job error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
