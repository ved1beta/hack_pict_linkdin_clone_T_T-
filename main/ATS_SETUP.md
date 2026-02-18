# ATS (Applicant Tracking System) Setup

## Overview

In-house ATS that:
- Accepts PDF & DOCX resume uploads
- Extracts text (unpdf, mammoth)
- Parses into structured JSON via AI (OpenAI GPT or Gemini)
- Scores resumes against jobs with 5 weighted components
- Stores everything in **MongoDB** (same as your existing app)

## 1. Database

No extra setup needed. ATS uses your existing MongoDB connection (`MONGODB_URI`).

## 2. AI Keys (at least one required)

**Option A - OpenAI** (recommended for best results):
```env
OPENAI_API_KEY=sk-...
```
Used for: resume structuring (GPT-4o-mini), embeddings (text-embedding-3-small)

**Option B - Gemini** (fallback for structuring only):
```env
GEMINI_API_KEY=...
```
Used for: resume structuring when OpenAI not set. Semantic similarity will default to 0.5 without OpenAI.

## 3. Scoring Weights

| Component | Weight | Description |
|-----------|--------|-------------|
| Skill Match | 50% | `len(common_skills) / len(required_skills)` |
| Experience Match | 20% | `min(candidate_years / required_years, 1.0)` |
| Education Relevance | 10% | Degree/field match |
| Keyword Density | 10% | Job keywords in resume |
| Semantic Similarity | 10% | OpenAI embeddings cosine similarity |

## 4. API Endpoints

- `POST /api/ats/upload` - Upload resume (multipart/form-data, field: `resume`)
- `POST /api/ats/score` - Score resume vs job `{ resumeUploadId, jobId }`
- `GET /api/ats/resumes` - List user's resumes and scores

## 5. Usage

1. **Settings** → Upload resume (PDF/DOCX)
2. **Jobs page** → Expand "Check ATS match score" on any job card
3. **Analytics** → View scores and breakdowns
