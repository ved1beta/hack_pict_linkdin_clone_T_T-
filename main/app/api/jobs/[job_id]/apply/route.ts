import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { User } from "@/mongodb/models/user";
import { currentUser } from "@clerk/nextjs/server";
import { runATSAnalysis } from "@/lib/ats";

export async function POST(
  request: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    await connectDB();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    const jobId = params.job_id;

    // Get user from database
    const dbUser = await User.findByUserId(userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get job
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(
      (app: any) => app.userId === userId
    );

    if (alreadyApplied) {
      return NextResponse.json(
        { error: "Already applied to this job" },
        { status: 400 }
      );
    }

    // Add application
    const application = {
      userId: dbUser.userId,
      userName: `${dbUser.firstName} ${dbUser.lastName}`,
      userEmail: dbUser.email,
      userImage: dbUser.userImage,
      resumeUrl: dbUser.resumeUrl,
      appliedAt: new Date(),
      status: "pending",
    };

    job.applications.push(application);
    await job.save();

    // Run ATS analysis in background (don't block response)
    runATSAnalysis(clerkUser.id, dbUser, jobId).catch((err) =>
      console.error("ATS analysis failed:", err)
    );

    return NextResponse.json(
      { success: true, message: "Application submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error applying to job:", error);
    return NextResponse.json(
      { error: "Failed to apply to job" },
      { status: 500 }
    );
  }
}