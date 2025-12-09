import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { Job } from "@/mongodb/models/job";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    
    const {
      recruiterId,
      recruiterName,
      recruiterImage,
      companyName,
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salary,
      skills,
      requirements,
    } = body;

    // Validate required fields
    if (!companyName || !title || !description || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new job
    const job = await Job.create({
      recruiterId,
      recruiterName,
      recruiterImage,
      companyName,
      title,
      description,
      location,
      jobType: jobType || "full-time",
      experienceLevel: experienceLevel || "entry",
      salary,
      skills: skills || [],
      requirements: requirements || [],
      applications: [],
      status: "open",
      postedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}