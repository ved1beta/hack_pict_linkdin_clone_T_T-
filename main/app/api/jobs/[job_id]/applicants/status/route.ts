import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(
  request: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { userId, status } = await request.json();
    const jobId = params.job_id;

    if (!userId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find job and update applicant status
    const job = await Job.findById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if recruiter owns this job
    if (job.recruiterId !== clerkUser.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find and update the application
    const applicationIndex = job.applications.findIndex(
      (app: any) => app.userId === userId
    );

    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    job.applications[applicationIndex].status = status;
    await job.save();

    return NextResponse.json(
      { success: true, message: "Status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating applicant status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}