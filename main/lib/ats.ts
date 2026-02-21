import { chatCompletion, structuredCompletion } from "./openrouter";
import { ResumeAnalysis } from "@/mongodb/models/resumeAnalysis";
import { Job } from "@/mongodb/models/job";
import { GitRepo } from "@/mongodb/models/gitRepo";

const GITHUB_API = "https://api.github.com";

async function fetchRepoLanguages(owner: string, repo: string): Promise<string[]> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "HEXjuy-Career-Platform",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });
    if (!res.ok) return [];
    const langs = await res.json();
    return Object.keys(langs);
  } catch {
    return [];
  }
}

async function buildResumeText(user: any, userId: string): Promise<string> {
  const parts: string[] = [];
  if (user.firstName || user.lastName) {
    parts.push(`Name: ${user.firstName || ""} ${user.lastName || ""}`);
  }
  if (user.email) parts.push(`Email: ${user.email}`);
  if (user.bio) parts.push(`Bio: ${user.bio}`);
  if (user.experience) parts.push(`Experience: ${user.experience}`);
  if (user.education) parts.push(`Education: ${user.education}`);
  if (user.skills?.length) {
    parts.push(`Skills: ${user.skills.join(", ")}`);
  }
  if (user.location) parts.push(`Location: ${user.location}`);

  // LinkedIn profile text
  if (user.linkedInText?.trim()) {
    parts.push("\n--- LinkedIn Profile ---");
    parts.push(user.linkedInText.trim());
  }

  // GitHub repos summary
  if (user.githubUsername) {
    try {
      const repos = await GitRepo.find({ userId }).lean();
      if (repos.length > 0) {
        parts.push("\n--- GitHub Projects ---");
        for (const r of repos as any[]) {
          const langs = await fetchRepoLanguages(r.owner, r.repoName);
          parts.push(`${r.repoName}: ${langs.join(", ") || "N/A"}`);
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return parts.join("\n") || "No profile information available.";
}

export async function runATSAnalysis(
  userId: string,
  user: any,
  jobId?: string,
  uploadedResumeText?: string | null
): Promise<any> {
  const resumeText = (uploadedResumeText && uploadedResumeText.trim())
    ? uploadedResumeText.trim()
    : await buildResumeText(user, userId);

  let jobDetails = "";
  let jobTitle = "";
  let companyName = "";

  if (jobId) {
    const job = await Job.findById(jobId).lean();
    if (job) {
      const j = job as any;
      jobTitle = j.title || "";
      companyName = j.companyName || "";
      jobDetails = `Job Title: ${j.title}
Company: ${j.companyName}
Description: ${j.description}
Requirements: ${(j.requirements || []).join(", ")}
Required Skills: ${(j.skills || []).join(", ")}
Experience Level: ${j.experienceLevel || "entry"}`;
    }
  }

  const prompt = jobId
    ? `You are an ATS expert. Analyze this candidate's resume/profile against the job posting.

CANDIDATE PROFILE/RESUME:
${resumeText}

JOB POSTING:
${jobDetails}

Respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
{
  "overallScore": number (0-100),
  "resumeScore": number (0-100),
  "jobMatchScore": number (0-100),
  "strengths": ["string"],
  "improvements": ["string"],
  "matchedSkills": ["string"],
  "missingSkills": ["string"],
  "recommendation": "string - one of: 'Strong match - apply now', 'Good match - apply with minor tweaks', 'Moderate match - improve resume first', 'Weak match - consider other roles'"
}`
    : `You are an ATS expert. Analyze this candidate's resume/profile.

CANDIDATE PROFILE/RESUME:
${resumeText}

Respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
{
  "overallScore": number (0-100),
  "resumeScore": number (0-100),
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendation": "string"
}

Set jobMatchScore, matchedSkills, missingSkills to empty arrays if not applicable.`;

  // Use OpenRouter for AI analysis
  const text = await chatCompletion([
    { role: "user", content: prompt }
  ], {
    temperature: 0.1,
    maxTokens: 2048
  });

  if (!text) throw new Error("Empty AI response");

  const jsonMatch = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(jsonMatch);

  const analysis: any = {
    userId,
    overallScore: Math.min(100, Math.max(0, parsed.overallScore || 0)),
    resumeScore: Math.min(100, Math.max(0, parsed.resumeScore || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    recommendation: parsed.recommendation || "Review your profile.",
    analyzedAt: new Date(),
  };

  if (jobId) {
    analysis.jobId = jobId;
    analysis.jobTitle = jobTitle;
    analysis.companyName = companyName;
    analysis.jobMatchScore = Math.min(
      100,
      Math.max(0, parsed.jobMatchScore ?? parsed.overallScore ?? 0)
    );
    analysis.matchedSkills = Array.isArray(parsed.matchedSkills)
      ? parsed.matchedSkills
      : [];
    analysis.missingSkills = Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills
      : [];
  }

  await ResumeAnalysis.create(analysis);

  if (jobId) {
    const score = analysis.jobMatchScore ?? analysis.overallScore;
    
    // Use updateOne with array filter to ensure atomic update
    await Job.updateOne(
      { _id: jobId, "applications.userId": userId },
      { 
        $set: { 
          "applications.$.aiScore": score 
        } 
      }
    );
    console.log(`[ATS] Updated job ${jobId} application score for ${userId} to ${score}`);
  }

  return analysis;
}
