/**
 * PATCH /api/recruiter/pipeline/[pipelineId]
 *
 * Move a candidate to a new stage in the pipeline.
 * Automatically creates a stage history entry.
 *
 * Body:
 * {
 *   newStage: "shortlisted" | "interview_scheduled" | "rejected",
 *   reason?: "Strong fit", "Schedule interview", etc.
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import {
  PipelineStage,
  PipelineStageType,
} from "@/mongodb/models/pipelineStage";
import { Notification } from "@/mongodb/models/notification";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { pipelineId: string } }
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

    const { pipelineId } = params;
    const { newStage, reason } = await req.json();

    const validStages = [
      "reviewed",
      "shortlisted",
      "interview_scheduled",
      "rejected",
    ];
    if (!validStages.includes(newStage)) {
      return NextResponse.json(
        { error: "Invalid stage" },
        { status: 400 }
      );
    }

    const pipeline = await PipelineStage.findById(pipelineId);
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline entry not found" },
        { status: 404 }
      );
    }

    const oldStage = pipeline.currentStage;

    // Move to new stage
    pipeline.currentStage = newStage as PipelineStageType;

    // Add to history
    pipeline.stageHistory.push({
      from: oldStage,
      to: newStage,
      movedBy: clerkUser.id,
      movedAt: new Date(),
      reason,
    });

    await pipeline.save();

    // Notify candidate of stage change (optional)
    const stageLabels: Record<string, string> = {
      reviewed: "Application Reviewed",
      shortlisted: "Shortlisted!",
      interview_scheduled: "Interview Scheduled",
      rejected: "Application Status Updated",
    };

    const stageMessages: Record<string, string> = {
      reviewed: "Your application has been reviewed",
      shortlisted: "Great news! You've been shortlisted",
      interview_scheduled: "You've been selected for an interview",
      rejected: "Your application status has been updated",
    };

    if (newStage !== oldStage) {
      await Notification.create({
        userId: pipeline.candidateId,
        message: stageMessages[newStage] || "Your application status has changed",
        type: newStage === "rejected" ? "warning" : "info",
        read: false,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Candidate moved from ${oldStage} to ${newStage}`,
      pipeline: {
        id: pipeline._id.toString(),
        currentStage: pipeline.currentStage,
        stageHistory: pipeline.stageHistory,
      },
    });
  } catch (err) {
    console.error("[recruiter/pipeline/[pipelineId]] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/pipeline/[pipelineId]
 *
 * Get detailed view of a candidate in the pipeline.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { pipelineId: string } }
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

    const { pipelineId } = params;

    const pipeline = await PipelineStage.findById(pipelineId).lean() as any;
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline entry not found" },
        { status: 404 }
      );
    }

    const candidate = await User.findOne({ userId: pipeline.candidateId })
      .select("userId firstName lastName email userImage bio skills")
      .lean() as any;

    return NextResponse.json({
      pipelineId,
      candidate: candidate
        ? {
            userId: candidate.userId,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
            userImage: candidate.userImage,
            bio: candidate.bio,
            skills: candidate.skills,
          }
        : null,
      currentStage: pipeline.currentStage,
      recruiterNotes: pipeline.recruiterNotes || [],
      candidateNotes: pipeline.candidateNotes || [],
      stageHistory: pipeline.stageHistory || [],
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
    });
  } catch (err) {
    console.error("[recruiter/pipeline/[pipelineId]] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline details" },
      { status: 500 }
    );
  }
}
