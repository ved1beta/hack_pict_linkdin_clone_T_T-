import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { User } from "@/mongodb/models/user";
import { ResumeAnalysis } from "@/mongodb/models/resumeAnalysis";
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

    // Check job filters
    if (job.filters) {
      // Check college verification requirement
      if (job.filters.requireCollegeVerification) {
        if (!dbUser.collegeVerification || dbUser.collegeVerification.status !== "approved") {
          return NextResponse.json(
            { error: "This job requires college verification. Please verify your college in settings." },
            { status: 403 }
          );
        }
      }

      // Check minimum CGPA requirement
      if (job.filters.minCGPA) {
        const userCGPA = dbUser.collegeVerification?.cgpa;
        if (!userCGPA || userCGPA < job.filters.minCGPA) {
          return NextResponse.json(
            { error: `This job requires a minimum CGPA of ${job.filters.minCGPA}. Your CGPA: ${userCGPA || "Not provided"}` },
            { status: 403 }
          );
        }
      }

      // Check specific colleges requirement
      if (job.filters.specificColleges && job.filters.specificColleges.length > 0) {
        const userCollege = dbUser.collegeVerification?.collegeName;
        if (!userCollege || !job.filters.specificColleges.includes(userCollege)) {
          return NextResponse.json(
            { error: `This job is only open to students from: ${job.filters.specificColleges.join(", ")}` },
            { status: 403 }
          );
        }
      }
    }

    // Check for existing ATS score
    let aiScore: number | undefined;
    const existingAnalysis = await ResumeAnalysis.findOne({
      userId: userId,
      jobId: jobId,
    }).sort({ analyzedAt: -1 });

    if (existingAnalysis) {
      aiScore = existingAnalysis.jobMatchScore || existingAnalysis.overallScore;
    }

    // Add application
    const application = {
      userId: dbUser.userId,
      userName: `${dbUser.firstName} ${dbUser.lastName}`,
      userEmail: dbUser.email,
      userImage: dbUser.userImage,
      resumeUrl: dbUser.resumeUrl,
      appliedAt: new Date(),
      status: "pending" as const,
      aiScore, // Include score if available
      collegeVerified: dbUser.collegeVerification?.status === "approved",
      collegeName: dbUser.collegeVerification?.status === "approved" ? dbUser.collegeVerification.collegeName : undefined,
      cgpa: dbUser.collegeVerification?.cgpa,
    };

    job.applications.push(application);
    await job.save();

    // Run ATS analysis if score is missing or old (optional: always re-run to ensure freshness)
    // We'll re-run it anyway to capture latest resume version if changed
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