import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeAnalysis } from "@/mongodb/models/resumeAnalysis";
import { Job } from "@/mongodb/models/job";

function buildResumeText(user: any): string {
  const parts: string[] = [];
  if (user.firstName || user.lastName) {
    parts.push(`Name: ${user.firstName || ""} ${user.lastName || ""}`);
  }
  if (user.bio) parts.push(`Bio: ${user.bio}`);
  if (user.experience) parts.push(`Experience: ${user.experience}`);
  if (user.education) parts.push(`Education: ${user.education}`);
  if (user.skills?.length) {
    parts.push(`Skills: ${user.skills.join(", ")}`);
  }
  if (user.location) parts.push(`Location: ${user.location}`);
  return parts.join("\n\n") || "No profile information available.";
}

export async function runATSAnalysis(
  userId: string,
  user: any,
  jobId?: string,
  uploadedResumeText?: string | null
): Promise<any> {
  const kimiKey = process.env.KIMI_K2_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!kimiKey && !geminiKey) return null;

  const resumeText = (uploadedResumeText && uploadedResumeText.trim())
    ? uploadedResumeText.trim()
    : buildResumeText(user);

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

  const callKimi = async (): Promise<string> => {
    if (!kimiKey) throw new Error("No Kimi key");
    const openai = new OpenAI({
      apiKey: kimiKey,
      baseURL: process.env.KIMI_BASE_URL || "https://integrate.api.nvidia.com/v1",
    });
    const response = await openai.chat.completions.create({
      model: process.env.KIMI_MODEL || "moonshotai/kimi-k2.5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });
    return response.choices[0]?.message?.content?.trim() ?? "";
  };

  const callGemini = async (): Promise<string> => {
    if (!geminiKey) throw new Error("No Gemini key");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  };

  let text: string;
  if (kimiKey) {
    text = await callKimi();
  } else if (geminiKey) {
    text = await callGemini();
  } else {
    throw new Error("No AI provider configured");
  }

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
    const job = await Job.findById(jobId);
    if (job) {
      const appIndex = job.applications.findIndex((a: any) => a.userId === userId);
      if (appIndex >= 0) {
        job.applications[appIndex].aiScore =
          analysis.jobMatchScore ?? analysis.overallScore;
        await job.save();
      }
    }
  }

  return analysis;
}
