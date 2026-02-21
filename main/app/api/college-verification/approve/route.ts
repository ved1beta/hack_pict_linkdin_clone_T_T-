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

    const { requestId, action, rejectionReason } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Find the verification request
    const verificationRequest = await CollegeVerificationRequest.findById(requestId);

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Verification request not found" },
        { status: 404 }
      );
    }

    if (verificationRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // TODO: Add college admin authentication check here
    // For now, we'll allow any authenticated user to approve/reject
    // In production, you should verify that the user is a college admin
    // and has permission to approve requests for this specific college

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update verification request
    verificationRequest.status = newStatus;
    verificationRequest.reviewedAt = new Date();
    verificationRequest.reviewedBy = clerkUser.id;
    if (action === "reject") {
      verificationRequest.rejectionReason = rejectionReason;
    }

    await verificationRequest.save();

    // Update user's college verification status
    const user = await User.findOne({ userId: verificationRequest.userId });

    if (user && user.collegeVerification) {
      user.collegeVerification.status = newStatus;
      user.collegeVerification.reviewedAt = new Date();
      if (action === "reject") {
        user.collegeVerification.rejectionReason = rejectionReason;
      }
      await user.save();
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Verification request ${action === "approve" ? "approved" : "rejected"} successfully` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing college verification:", error);
    return NextResponse.json(
      { error: "Failed to process verification request" },
      { status: 500 }
    );
  }
}


