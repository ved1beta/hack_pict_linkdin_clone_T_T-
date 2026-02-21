/**
 * POST /api/recruiter/jobs/[jobId]/pipeline/add-candidate
 *
 * Add a candidate to the recruitment pipeline for a job.
 * This is called when a recruiter wants to start tracking a candidate through the pipeline.
 * Can be called when a candidate applies, or manually by the recruiter.
 *
 * Body:
 * {
 *   candidateId: "clerk_user_id"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { PipelineStage } from "@/mongodb/models/pipelineStage";
import { Notification } from "@/mongodb/models/notification";

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

    const recruiter = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!recruiter || recruiter.userType !== "recruiter") {
      return NextResponse.json(
        { error: "Recruiter access required" },
        { status: 403 }
      );
    }

    const { jobId } = params;
    const { candidateId } = await req.json();

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const candidate = await User.findOne({ userId: candidateId }).lean() as any;
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if already in pipeline
    const existing = await PipelineStage.findOne({
      jobId,
      candidateId,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Candidate already in pipeline for this job" },
        { status: 409 }
      );
    }

    // Create pipeline entry
    const pipelineEntry = new PipelineStage({
      jobId,
      candidateId,
      currentStage: "reviewed",
      recruiterNotes: [],
      candidateNotes: [],
      stageHistory: [
        {
          from: "reviewed" as const,
          to: "reviewed" as const,
          movedBy: clerkUser.id,
          movedAt: new Date(),
          reason: "Added to pipeline",
        },
      ],
    });

    await pipelineEntry.save();

    // Notify candidate that they're being tracked
    await Notification.create({
      userId: candidateId,
      message: "Your application is under review for this position",
      type: "info",
      read: false,
    });

    return NextResponse.json({
      ok: true,
      message: "Candidate added to pipeline",
      pipelineId: pipelineEntry._id.toString(),
      candidateId,
      currentStage: pipelineEntry.currentStage,
    });
  } catch (err) {
    console.error("[recruiter/jobs/pipeline/add-candidate] POST error:", err);
    return NextResponse.json(
      { error: "Failed to add candidate to pipeline" },
      { status: 500 }
    );
  }
}
