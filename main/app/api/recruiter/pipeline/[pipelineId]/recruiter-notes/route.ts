/**
 * POST /api/recruiter/pipeline/[pipelineId]/recruiter-notes
 *
 * Add an internal recruiter note (not visible to candidate unless they're rejected/in interview).
 * Types: "general" (regular note), "rejection_reason" (why rejected), "suggestion" (improvement ideas)
 *
 * Body:
 * {
 *   text: "Strong technical background but lacks experience with React",
 *   type: "general" | "rejection_reason" | "suggestion"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { PipelineStage } from "@/mongodb/models/pipelineStage";

export async function POST(
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
    const { text, type = "general" } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Note text is required" },
        { status: 400 }
      );
    }

    const validTypes = ["general", "rejection_reason", "suggestion"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid note type" },
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

    // Add recruiter note
    pipeline.recruiterNotes.push({
      text: text.trim(),
      addedBy: clerkUser.id,
      addedAt: new Date(),
      type: type as "general" | "rejection_reason" | "suggestion",
    });

    await pipeline.save();

    return NextResponse.json({
      ok: true,
      message: "Note added",
      recruiterNotes: pipeline.recruiterNotes,
    });
  } catch (err) {
    console.error("[recruiter/pipeline/recruiter-notes] POST error:", err);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/pipeline/[pipelineId]/recruiter-notes
 *
 * Fetch all recruiter notes for a candidate (internal only).
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

    return NextResponse.json({
      pipelineId,
      recruiterNotes: pipeline.recruiterNotes || [],
    });
  } catch (err) {
    console.error("[recruiter/pipeline/recruiter-notes] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
