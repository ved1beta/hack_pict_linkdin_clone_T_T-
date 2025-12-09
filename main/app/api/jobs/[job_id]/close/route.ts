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

    const jobId = params.job_id;

    // Find and update job
    const job = await Job.findByIdAndUpdate(
      jobId,
      { status: "closed" },
      { new: true }
    );

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, job },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error closing job:", error);
    return NextResponse.json(
      { error: "Failed to close job" },
      { status: 500 }
    );
  }
}