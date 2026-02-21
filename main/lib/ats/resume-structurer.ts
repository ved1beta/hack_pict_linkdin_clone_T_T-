/**
 * AI-Based Resume Structuring
 * Supports: Kimi K2, OpenAI GPT, Gemini (priority order)
 * Kimi K2 docs: https://kimi-k2.ai/api-docs
 */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const STRUCTURE_PROMPT = `Extract structured data from this resume text. Return ONLY valid JSON with no markdown, no code blocks, no extra text.
Required schema (use empty string or empty array for missing fields):
{
  "name": "",
  "email": "",
  "phone": "",
  "skills": [],
  "work_experience": [
    {"company": "", "role": "", "duration": ""}
  ],
  "education": [
    {"institution": "", "degree": "", "year": ""}
  ],
  "total_years_experience": 0
}
Parse duration strings like "2020-2022" or "2 years" to estimate total_years_experience as a number.
Resume text:`;

export async function structureResumeWithAI(
  rawText: string
): Promise<StructuredResume> {
  if (!rawText || rawText.trim().length < 50) {
    throw new Error("Resume text too short to parse");
  }

  const kimiKey = process.env.KIMI_K2_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (kimiKey) return structureWithKimi(rawText, kimiKey);
  if (openaiKey) return structureWithOpenAI(rawText, openaiKey);
  if (geminiKey) return structureWithGemini(rawText, geminiKey);

  throw new Error("Set KIMI_K2_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in .env.local");
}

async function structureWithKimi(
  rawText: string,
  apiKey: string
): Promise<StructuredResume> {
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
  const response = await openai.chat.completions.create({
    model: process.env.KIMI_MODEL || "moonshotai/kimi-k2.5",
    messages: [
      {
        role: "system",
        content: "You extract resume data into strict JSON. Return only valid JSON, no markdown.",
      },
      {
        role: "user",
        content: STRUCTURE_PROMPT + rawText.slice(0, 12000),
      },
    ],
    temperature: 0.1,
    max_tokens: 16384,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");

  return parseStructuredResponse(content);
}

async function structureWithOpenAI(
  rawText: string,
  apiKey: string
): Promise<StructuredResume> {
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You extract resume data into strict JSON. Return only valid JSON, no markdown.",
      },
      {
        role: "user",
        content: STRUCTURE_PROMPT + rawText.slice(0, 12000),
      },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");

  return parseStructuredResponse(content);
}

async function structureWithGemini(
  rawText: string,
  apiKey: string
): Promise<StructuredResume> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
  const result = await model.generateContent(
    STRUCTURE_PROMPT + rawText.slice(0, 12000)
  );
  const content = result.response.text()?.trim();
  if (!content) throw new Error("Empty AI response");

  return parseStructuredResponse(content);
}

function parseStructuredResponse(content: string): StructuredResume {
  const cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/\n?```/g, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Invalid JSON in AI response");
    }
  }

  return normalizeStructuredResume(parsed);
}

function normalizeStructuredResume(raw: any): StructuredResume {
  return {
    name: String(raw?.name ?? "").trim(),
    email: String(raw?.email ?? "").trim(),
    phone: String(raw?.phone ?? "").trim(),
    skills: Array.isArray(raw?.skills)
      ? raw.skills.map((s: any) => String(s).trim()).filter(Boolean)
      : [],
    work_experience: Array.isArray(raw?.work_experience)
      ? raw.work_experience.map((w: any) => ({
          company: String(w?.company ?? "").trim(),
          role: String(w?.role ?? "").trim(),
          duration: String(w?.duration ?? "").trim(),
        }))
      : [],
    education: Array.isArray(raw?.education)
      ? raw.education.map((e: any) => ({
          institution: String(e?.institution ?? "").trim(),
          degree: String(e?.degree ?? "").trim(),
          year: String(e?.year ?? "").trim(),
        }))
      : [],
    total_years_experience: Number(raw?.total_years_experience) || 0,
  };
}
