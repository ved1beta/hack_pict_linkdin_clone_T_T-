import { NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { CollegeVerificationRequest } from "@/mongodb/models/collegeVerificationRequest";
import { currentUser } from "@clerk/nextjs/server";

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

    // TODO: Add college admin authentication check here
    // For now, we'll return all pending requests
    // In production, filter by college based on the admin's college

    const { searchParams } = new URL(request.url);
    const collegeName = searchParams.get("collegeName");

    const pendingRequests = await CollegeVerificationRequest.getPendingRequests(
      collegeName || undefined
    );

    return NextResponse.json(
      { 
        requests: pendingRequests
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending requests" },
      { status: 500 }
    );
  }
}

