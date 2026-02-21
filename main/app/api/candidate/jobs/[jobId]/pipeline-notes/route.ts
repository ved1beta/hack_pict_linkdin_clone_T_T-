/**
 * POST /api/candidate/jobs/[jobId]/pipeline-notes
 *
 * Candidate adds their own note/response to a job application.
 * This note is visible to both the candidate and recruiters.
 *
 * Body:
 * {
 *   text: "I'm very interested in this role because..."
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { PipelineStage } from "@/mongodb/models/pipelineStage";

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user is a student/candidate
    const user = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!user || user.userType !== "student") {
      return NextResponse.json(
        { error: "Candidate access required" },
        { status: 403 }
      );
    }

    const { jobId } = params;
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Note text is required" },
        { status: 400 }
      );
    }

    // Find the candidate's pipeline entry for this job
    const pipelineEntry = await PipelineStage.findOne({
      jobId,
      candidateId: clerkUser.id,
    });

    if (!pipelineEntry) {
      return NextResponse.json(
        { error: "No application found for this job" },
        { status: 404 }
      );
    }

    // Add candidate note
    pipelineEntry.candidateNotes.push({
      text: text.trim(),
      addedAt: new Date(),
    });

    await pipelineEntry.save();

    return NextResponse.json({
      ok: true,
      message: "Your note has been added",
      candidateNotes: pipelineEntry.candidateNotes,
    });
  } catch (err) {
    console.error("[candidate/jobs/pipeline-notes] POST error:", err);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidate/jobs/[jobId]/pipeline-notes
 *
 * Candidate views their own notes and recruiter feedback for a specific job.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!user || user.userType !== "student") {
      return NextResponse.json(
        { error: "Candidate access required" },
        { status: 403 }
      );
    }

    const { jobId } = params;

    const pipelineEntry = await PipelineStage.findOne({
      jobId,
      candidateId: clerkUser.id,
    }).lean() as any;

    if (!pipelineEntry) {
      return NextResponse.json(
        { error: "No application found for this job" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      currentStage: pipelineEntry.currentStage,
      candidateNotes: pipelineEntry.candidateNotes || [],
      // Candidates see recruiter notes ONLY if they've been rejected or in interview
      recruiterNotes:
        ["rejected", "interview_scheduled"].includes(pipelineEntry.currentStage)
          ? pipelineEntry.recruiterNotes || []
          : [],
      stageHistory: pipelineEntry.stageHistory || [],
    });
  } catch (err) {
    console.error("[candidate/jobs/pipeline-notes] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
