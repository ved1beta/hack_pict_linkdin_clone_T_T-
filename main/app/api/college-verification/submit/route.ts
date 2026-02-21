import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { CollegeVerificationRequest } from "@/mongodb/models/collegeVerificationRequest";
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

    const { collegeName, collegeEmail, studentId, department, branch, graduationYear, cgpa } = await request.json();

    if (!collegeName || !collegeEmail || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate college email format (should be from college domain)
    const emailDomain = collegeEmail.split('@')[1];
    if (!emailDomain || emailDomain.includes('gmail') || emailDomain.includes('yahoo') || emailDomain.includes('outlook')) {
      return NextResponse.json(
        { error: "Please use your official college email address" },
        { status: 400 }
      );
    }

    // Find the user
    const dbUser = await User.findOne({ userId: clerkUser.id });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a student
    if (dbUser.userType !== "student") {
      return NextResponse.json(
        { error: "Only students can submit college verification" },
        { status: 403 }
      );
    }

    // Check if already verified
    if (dbUser.collegeVerification && dbUser.collegeVerification.status === "approved") {
      return NextResponse.json(
        { error: "You are already verified" },
        { status: 400 }
      );
    }

    // Check if there's a pending request
    const existingRequest = await CollegeVerificationRequest.findOne({
      userId: clerkUser.id,
      status: "pending"
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending verification request" },
        { status: 400 }
      );
    }

    // Create verification request
    const verificationRequest = new CollegeVerificationRequest({
      userId: clerkUser.id,
      userName: `${dbUser.firstName} ${dbUser.lastName}`,
      userEmail: dbUser.email,
      collegeName,
      collegeEmail,
      studentId,
      department,
      branch,
      graduationYear,
      cgpa,
      status: "pending",
      submittedAt: new Date(),
    });

    await verificationRequest.save();

    // Update user's college verification status
    dbUser.collegeVerification = {
      collegeName,
      collegeEmail,
      studentId,
      department,
      branch,
      graduationYear,
      cgpa,
      status: "pending",
      submittedAt: new Date(),
    };

    await dbUser.save();

    return NextResponse.json(
      { 
        success: true, 
        message: "Verification request submitted successfully. Your college will review it soon." 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting college verification:", error);
    return NextResponse.json(
      { error: "Failed to submit verification request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const dbUser = await User.findOne({ userId: clerkUser.id }).lean();

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        collegeVerification: dbUser.collegeVerification || null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching college verification:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}

