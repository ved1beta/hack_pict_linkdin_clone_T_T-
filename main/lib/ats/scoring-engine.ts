/**
 * ATS Scoring Engine
 * Weights: Skill Match 50%, Experience Match 20%, Education 10%, Keyword Density 10%, Semantic Similarity 10%
 */

import { generateEmbedding } from "../openrouter";
import type { StructuredResume } from "./resume-structurer";

export interface JobData {
  title: string;
  description: string;
  requirements?: string[];
  skills: string[];
  experienceLevel?: "entry" | "mid" | "senior";
}

export interface ScoreBreakdown {
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordDensity: number;
  semanticSimilarity: number;
  weightedScore: number;
  requiredYears?: number;
  candidateYears?: number;
  commonSkills?: string[];
  missingSkills?: string[];
  matchedKeywords?: string[];
}

const WEIGHTS = {
  skillMatch: 0.5,
  experienceMatch: 0.2,
  educationRelevance: 0.1,
  keywordDensity: 0.1,
  semanticSimilarity: 0.1,
};

const EXPERIENCE_LEVEL_YEARS: Record<string, number> = {
  entry: 0,
  mid: 3,
  senior: 7,
};

export async function calculateAtsScore(
  resume: StructuredResume,
  resumeText: string,
  job: JobData
): Promise<{ score: number; breakdown: ScoreBreakdown }> {
  const skillResult = calculateSkillMatch(resume.skills, job.skills);
  const experienceMatch = calculateExperienceMatch(resume, job);
  const educationMatch = calculateEducationRelevance(resume, job);
  const keywordDensity = calculateKeywordDensity(job, resumeText);
  const semanticSimilarity = await calculateSemanticSimilarity(
    job.description,
    resumeText
  );

  const weightedScore =
    skillResult.score * WEIGHTS.skillMatch +
    experienceMatch * WEIGHTS.experienceMatch +
    educationMatch * WEIGHTS.educationRelevance +
    keywordDensity * WEIGHTS.keywordDensity +
    semanticSimilarity * WEIGHTS.semanticSimilarity;

  const finalScore = Math.round(Math.min(100, Math.max(0, weightedScore * 100)));

  const requiredYears =
    EXPERIENCE_LEVEL_YEARS[job.experienceLevel || "entry"] ?? 0;

  const breakdown: ScoreBreakdown = {
    skillMatch: skillResult.score,
    experienceMatch,
    educationMatch,
    keywordDensity,
    semanticSimilarity,
    weightedScore: finalScore / 100,
    requiredYears,
    candidateYears: resume.total_years_experience,
    commonSkills: skillResult.common,
    missingSkills: skillResult.missing,
  };

  return { score: finalScore, breakdown };
}

// 4A: Skill Match - intersection / required_skills
function calculateSkillMatch(
  candidateSkills: string[],
  requiredSkills: string[]
): { score: number; common: string[]; missing: string[] } {
  const normalize = (s: string) => s.toLowerCase().trim();
  const candidateSet = new Set(candidateSkills.map(normalize));
  const requiredNorm = requiredSkills.map(normalize);
  const requiredSet = new Set(requiredNorm);

  const common: string[] = [];
  const missing: string[] = [];

  requiredSet.forEach((r) => {
    let found = false;
    for (const c of Array.from(candidateSet)) {
      if (c.includes(r) || r.includes(c)) {
        found = true;
        if (!common.includes(r)) common.push(r);
        break;
      }
    }
    if (!found) missing.push(r);
  });

  const score =
    requiredSkills.length === 0 ? 1 : common.length / requiredSkills.length;
  return {
    score: Math.min(1, score),
    common,
    missing,
  };
}

// 4B: Experience Match - min(candidate_years / required_years, 1.0)
function calculateExperienceMatch(
  resume: StructuredResume,
  job: JobData
): number {
  const requiredYears =
    EXPERIENCE_LEVEL_YEARS[job.experienceLevel || "entry"] ?? 0;
  const candidateYears = resume.total_years_experience ?? 0;

  if (requiredYears === 0) return 1;
  return Math.min(candidateYears / requiredYears, 1);
}

// 4C: Education Relevance - check degree/field match
function calculateEducationRelevance(
  resume: StructuredResume,
  job: JobData
): number {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const eduKeywords = ["bachelor", "master", "phd", "degree", "btech", "mtech", "bs", "ms", "mba", "bca", "mca"];

  const hasRelevantEdu = resume.education.some((e) => {
    const deg = (e.degree + " " + e.institution).toLowerCase();
    return eduKeywords.some((k) => deg.includes(k));
  });

  const jobRequiresDegree = eduKeywords.some((k) => jobText.includes(k));
  if (!jobRequiresDegree) return 1;
  return hasRelevantEdu ? 1 : 0.3;
}

// 4D: Keyword Density - frequency of job keywords in resume
function calculateKeywordDensity(job: JobData, resumeText: string): number {
  const keywords = [
    ...(job.skills || []),
    ...(job.requirements || []),
    ...extractKeywords(job.title),
    ...extractKeywords(job.description),
  ].filter(Boolean);

  const unique = Array.from(new Set(keywords.map((k) => k.toLowerCase().trim())));
  if (unique.length === 0) return 1;

  const resumeLower = resumeText.toLowerCase();
  let matchCount = 0;
  const matched: string[] = [];

  for (const kw of unique) {
    if (resumeLower.includes(kw)) {
      matchCount++;
      matched.push(kw);
    }
  }

  return unique.length === 0 ? 1 : matchCount / unique.length;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return Array.from(new Set(words)).slice(0, 20);
}

// 4E: Semantic Similarity - OpenRouter embeddings + cosine similarity
async function calculateSemanticSimilarity(
  jobDesc: string,
  resumeText: string
): Promise<number> {
  try {
    const [jobEmb, resumeEmb] = await Promise.all([
      generateEmbedding(jobDesc.slice(0, 8000)),
      generateEmbedding(resumeText.slice(0, 8000)),
    ]);

    return cosineSimilarity(jobEmb, resumeEmb);
  } catch (error) {
    console.error("Error calculating semantic similarity:", error);
    return 0.5; // fallback
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : Math.max(0, Math.min(1, dot / denom));
}
