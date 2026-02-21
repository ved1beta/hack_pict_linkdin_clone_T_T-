/**
 * AI-Based Resume Structuring using OpenRouter
 * Docs: https://openrouter.ai/docs/quickstart
 */

import { chatCompletion, structuredCompletion } from "../openrouter";

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface StructuredResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  work_experience: WorkExperience[];
  education: Education[];
  total_years_experience: number;
}

function parseStructuredResponse(content: string): StructuredResume {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    name: parsed.name || "Unknown",
    email: parsed.email || "",
    phone: parsed.phone || "",
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    work_experience: Array.isArray(parsed.work_experience)
      ? parsed.work_experience.map((exp: any) => ({
          company: exp.company || "",
          role: exp.role || "",
          duration: exp.duration || "",
        }))
      : [],
    education: Array.isArray(parsed.education)
      ? parsed.education.map((edu: any) => ({
          institution: edu.institution || "",
          degree: edu.degree || "",
          year: edu.year || "",
        }))
      : [],
    total_years_experience: parsed.total_years_experience || 0,
  };
}

async function structureFromGitHubWithAI(
  profileText: string,
  structureFn: (prompt: string) => Promise<StructuredResume>
): Promise<StructuredResume> {
  const prompt = `Extract resume information from this GitHub profile data and return ONLY valid JSON (no markdown, no code blocks):

${profileText}

Return JSON with this exact structure:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "work_experience": [{"company": "string", "role": "string", "duration": "string"}],
  "education": [{"institution": "string", "degree": "string", "year": "string"}],
  "total_years_experience": number
}`;

  return structureFn(prompt);
}

export async function structureResumeFromGitHub(
  profileText: string
): Promise<StructuredResume> {
  if (!profileText || profileText.trim().length < 30) {
    throw new Error("GitHub profile data too short");
  }

  return structureFromGitHubWithAI(profileText, async (prompt: string) => {
    const content = await chatCompletion([
      {
        role: "system",
        content: "You extract resume data from developer profiles into strict JSON. Return only valid JSON, no markdown.",
      },
      { role: "user", content: prompt },
    ], {
      temperature: 0.1,
    });

    if (!content) throw new Error("Empty AI response");
    return parseStructuredResponse(content);
  });
}

export async function structureResumeWithAI(
  rawText: string
): Promise<StructuredResume> {
  if (!rawText || rawText.trim().length < 50) {
    throw new Error("Resume text too short to parse");
  }

  const prompt = `Extract resume information from this text and return ONLY valid JSON (no markdown, no code blocks):

${rawText}

Return JSON with this exact structure:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "work_experience": [{"company": "string", "role": "string", "duration": "string"}],
  "education": [{"institution": "string", "degree": "string", "year": "string"}],
  "total_years_experience": number
}`;

  const content = await chatCompletion([
    {
      role: "system",
      content: "You extract resume data into strict JSON. Return only valid JSON, no markdown.",
    },
    { role: "user", content: prompt },
  ], {
    temperature: 0.1,
  });

  if (!content) throw new Error("Empty AI response");
  return parseStructuredResponse(content);
}
