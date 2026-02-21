/**
 * Local AI Analysis using Groq API (100% FREE, UNLIMITED)
 * No quota limits, blazingly fast, completely free
 * Server-side only — uses Groq API
 */

import Groq from "groq-sdk";

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    });
  }
  return groq;
}

/**
 * Analyze a resume against a job posting
 */
export async function analyzeResumeForJob(
  resumeText: string,
  jobDetails: {
    title: string;
    company: string;
    description: string;
    requirements: string[];
    skills: string[];
    experienceLevel?: string;
  }
): Promise<any> {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach. Analyze this candidate's resume against the job posting.

CANDIDATE RESUME:
${resumeText}

JOB POSTING:
Title: ${jobDetails.title}
Company: ${jobDetails.company}
Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements.join(", ")}
Required Skills: ${jobDetails.skills.join(", ")}
Experience Level: ${jobDetails.experienceLevel || "entry"}

Respond with ONLY valid JSON (no markdown, no code blocks, just raw JSON):
{
  "overallScore": number between 0-100,
  "resumeScore": number between 0-100,
  "jobMatchScore": number between 0-100,
  "strengths": ["string"],
  "improvements": ["string"],
  "matchedSkills": ["string"],
  "missingSkills": ["string"],
  "recommendation": "string"
}`;

  const message = await getGroqClient().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });

  const responseText =
    message.choices[0]?.message?.content || "";

  // Extract JSON from response
  const jsonMatch = responseText
    .replace(/```json\n?|\n?```/g, "")
    .replace(/```\n?|\n?```/g, "")
    .trim();

  return JSON.parse(jsonMatch);
}

/**
 * Analyze a resume profile generally
 */
export async function analyzeResumeGeneral(resumeText: string): Promise<any> {
  const prompt = `You are an expert career coach and resume analyst. Analyze this candidate's resume and provide actionable feedback.

CANDIDATE RESUME:
${resumeText}

Respond with ONLY valid JSON (no markdown, no code blocks, just raw JSON):
{
  "overallScore": number between 0-100,
  "resumeScore": number between 0-100,
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendation": "string"
}`;

  const message = await getGroqClient().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });

  const responseText =
    message.choices[0]?.message?.content || "";

  // Extract JSON from response
  const jsonMatch = responseText
    .replace(/```json\n?|\n?```/g, "")
    .replace(/```\n?|\n?```/g, "")
    .trim();

  return JSON.parse(jsonMatch);
}

/**
 * Analyze GitHub portfolio
 */
export async function analyzeGitPortfolio(
  repoSummary: Array<{
    repoName: string;
    languages: string[];
    description?: string;
    myCommits?: string[];
  }>
): Promise<any> {
  const summary = repoSummary
    .map(
      (r) =>
        `- ${r.repoName}: ${r.languages.join(", ") || "N/A"}${r.description ? ` | ${r.description}` : ""}` +
        (r.myCommits?.length ? `\n  My commits: ${r.myCommits.slice(0, 5).join("; ")}` : "")
    )
    .join("\n");

  const prompt = `You are a senior developer reviewing a candidate's GitHub portfolio.
The "My commits" shown are ONLY this candidate's commits (filtered by author).

REPOSITORIES:
${summary}

Analyze the portfolio and respond with ONLY valid JSON (no markdown, no code blocks, just raw JSON):
{
  "score": number between 0-100,
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendation": "string"
}

Consider: tech stack diversity, project complexity, documentation, language usage.`;

  const message = await getGroqClient().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });

  const responseText =
    message.choices[0]?.message?.content || "";

  // Extract JSON from response
  const jsonMatch = responseText
    .replace(/```json\n?|\n?```/g, "")
    .replace(/```\n?|\n?```/g, "")
    .trim();

  return JSON.parse(jsonMatch);
}

/**
 * Chat with Groq for career advice
 */
export async function chatWithClaude(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string
): Promise<string> {
  const message = await getGroqClient().chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    model: "llama-3.3-70b-versatile",
  });

  return message.choices[0]?.message?.content || "";
}

/**
 * Stream chat response for real-time feedback
 */
export async function* chatWithClaudeStream(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string
) {
  const stream = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    model: "llama-3.3-70b-versatile",
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}
