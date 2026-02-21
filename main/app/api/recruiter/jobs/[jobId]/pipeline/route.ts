/**
 * GET /api/recruiter/jobs/[jobId]/pipeline
 *
 * Fetch the recruitment pipeline board for a job.
 * Returns all candidates grouped by stage: Reviewed, Shortlisted, Interview Scheduled, Rejected.
 *
 * Returns:
 * {
 *   jobId: string,
 *   jobTitle: string,
 *   company: string,
 *   stages: {
 *     reviewed: [ { candidateId, name, email, stage, recruiterNotes, candidateNotes } ],
 *     shortlisted: [ ... ],
 *     interview_scheduled: [ ... ],
 *     rejected: [ ... ]
 *   },
 *   totalCandidates: number
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { PipelineStage, PipelineStageType } from "@/mongodb/models/pipelineStage";

const STAGES: PipelineStageType[] = [
  "reviewed",
  "shortlisted",
  "interview_scheduled",
  "rejected",
];

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

    const recruiter = await User.findOne({ userId: clerkUser.id }).lean() as any;
    if (!recruiter || recruiter.userType !== "recruiter") {
      return NextResponse.json(
        { error: "Recruiter access required" },
        { status: 403 }
      );
    }

    const { jobId } = params;

    // Fetch all pipeline stages for this job
    const pipelineEntries = await PipelineStage.find({ jobId })
      .sort({ currentStage: 1, updatedAt: -1 })
      .lean() as any[];

    if (pipelineEntries.length === 0) {
      // No candidates in pipeline yet
      return NextResponse.json({
        jobId,
        jobTitle: "Unknown Job",
        stages: {
          reviewed: [],
          shortlisted: [],
          interview_scheduled: [],
          rejected: [],
        },
        totalCandidates: 0,
      });
    }

    // Fetch candidate details (names, emails)
    const candidateIds = pipelineEntries.map((p) => p.candidateId);
    const candidates = await User.find({ userId: { $in: candidateIds } })
      .select("userId firstName lastName email userImage")
      .lean() as any[];

    const candidateMap = new Map(candidates.map((c) => [c.userId, c]));

    // Group by stage
    const stages: Record<PipelineStageType, any[]> = {
      reviewed: [],
      shortlisted: [],
      interview_scheduled: [],
      rejected: [],
    };

    for (const entry of pipelineEntries) {
      const candidate = candidateMap.get(entry.candidateId);
      if (!candidate) continue;

      const item = {
        pipelineId: entry._id.toString(),
        candidateId: entry.candidateId,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        userImage: candidate.userImage,
        currentStage: entry.currentStage,
        recruiterNotes: entry.recruiterNotes || [],
        candidateNotes: entry.candidateNotes || [],
        stageHistory: entry.stageHistory || [],
        updatedAt: entry.updatedAt,
      };

      stages[entry.currentStage].push(item);
    }

    return NextResponse.json({
      jobId,
      stages,
      totalCandidates: pipelineEntries.length,
    });
  } catch (err) {
    console.error("[recruiter/jobs/pipeline] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline" },
      { status: 500 }
    );
  }
}
