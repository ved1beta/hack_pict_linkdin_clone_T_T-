import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const dbUser = await User.findByUserId(clerkUser.id);
    
    if (!dbUser || dbUser.userType !== "recruiter") {
      return NextResponse.json({ error: "Only recruiters can recommend" }, { status: 403 });
    }

    const { candidateId, companyName, jobId } = await req.json();

    if (!candidateId || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the CANDIDATE (not the current user!)
    const candidate = await User.findOne({ userId: candidateId });
    
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Check if already recommended by this company
    const alreadyRecommended = candidate.recommendations?.some(
      (rec: any) => rec.companyName === companyName
    );

    if (alreadyRecommended) {
      // REMOVE recommendation (toggle off)
      candidate.recommendations = candidate.recommendations?.filter(
        (rec: any) => rec.companyName !== companyName
      );
      await candidate.save();
      
      return NextResponse.json({
        success: true,
        message: `Recommendation removed from ${candidate.firstName} ${candidate.lastName}`,
        action: "removed"
      });
    } else {
      // ADD recommendation
      if (!candidate.recommendations) {
        candidate.recommendations = [];
      }

      candidate.recommendations.push({
        companyName,
        jobId,
        recommendedAt: new Date(),
      });

      await candidate.save();

      return NextResponse.json({
        success: true,
        message: `${candidate.firstName} ${candidate.lastName} has been recommended!`,
        action: "added"
      });
    }
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: "Failed to process recommendation" },
      { status: 500 }
    );
  }
}
