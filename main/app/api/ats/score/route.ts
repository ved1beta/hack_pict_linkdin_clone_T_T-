/**
 * ATS Score API
 * Scores a resume (by resumeUploadId) against a job (jobId).
 * Stores result in MongoDB.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import connectDB from "@/mongodb/db";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { AtsScore } from "@/mongodb/models/atsScore";
import { Job } from "@/mongodb/models/job";
import { User } from "@/mongodb/models/user";
import { calculateAtsScore } from "@/lib/ats/scoring-engine";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeUploadId, jobId } = await request.json();

    if (!resumeUploadId || !jobId) {
      return NextResponse.json(
        { error: "resumeUploadId and jobId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const resumeUpload = await ResumeUpload.findOne({
      _id: new mongoose.Types.ObjectId(resumeUploadId),
      userId: user.id,
    }).lean();

    if (!resumeUpload) {
      return NextResponse.json(
        { error: "Resume not found or access denied" },
        { status: 404 }
      );
    }

    if (!resumeUpload.extractedText) {
      return NextResponse.json(
        { error: "Resume has no extracted text" },
        { status: 400 }
      );
    }

    const parsed = await ParsedResume.findOne({
      resumeUploadId: resumeUpload._id,
    }).lean();

    if (!parsed) {
      return NextResponse.json(
        { error: "Resume not yet parsed. Upload again." },
        { status: 400 }
      );
    }

    const jobDoc = await Job.findById(jobId).lean();
    if (!jobDoc) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobDoc as any;
    const structuredResume = {
      name: parsed.name ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      skills: parsed.skills ?? [],
      work_experience: (parsed.workExperience as any[]) ?? [],
      education: (parsed.education as any[]) ?? [],
      total_years_experience: parsed.totalYearsExperience ?? 0,
    };

    const jobData = {
      title: job.title,
      description: job.description,
      requirements: job.requirements ?? [],
      skills: job.skills ?? [],
      experienceLevel: job.experienceLevel ?? "entry",
    };

    const { score, breakdown } = await calculateAtsScore(
      structuredResume,
      resumeUpload.extractedText,
      jobData
    );

    const atsRecord = await AtsScore.findOneAndUpdate(
      { resumeUploadId: resumeUpload._id, jobId },
      {
        parsedResumeId: parsed._id,
        userId: user.id,
        score,
        skillMatch: breakdown.skillMatch,
        experienceMatch: breakdown.experienceMatch,
        educationMatch: breakdown.educationMatch,
        keywordDensity: breakdown.keywordDensity,
        semanticSimilarity: breakdown.semanticSimilarity,
        breakdown,
      },
      { upsert: true, new: true }
    );

    // Update aiScore in job application
    const jobDocWithApps = await Job.findById(jobId);
    if (jobDocWithApps) {
      const appIndex = jobDocWithApps.applications.findIndex(
        (a: any) => a.userId === user.id
      );
      if (appIndex >= 0) {
        jobDocWithApps.applications[appIndex].aiScore = score;
        await jobDocWithApps.save();
      }
    }

    return NextResponse.json({
      success: true,
      score,
      breakdown: {
        skillMatch: Math.round(breakdown.skillMatch * 100),
        experienceMatch: Math.round(breakdown.experienceMatch * 100),
        educationMatch: Math.round(breakdown.educationMatch * 100),
        keywordDensity: Math.round(breakdown.keywordDensity * 100),
        semanticSimilarity: Math.round(breakdown.semanticSimilarity * 100),
        commonSkills: breakdown.commonSkills,
        missingSkills: breakdown.missingSkills,
      },
      atsId: atsRecord._id.toString(),
    });
  } catch (err) {
    console.error("ATS score error:", err);
    const msg = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
