import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Hackathon } from "@/mongodb/models/hackathon";

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

    const dbUser = await User.findOne({ userId: clerkUser.id });
    if (!dbUser || dbUser.userType !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can create hackathons" },
        { status: 403 }
      );
    }

    const {
      candidateIds,
      title,
      description,
      type,
      venue,
      date,
      startTime,
      endTime,
      duration,
      maxParticipants,
      prizes,
      requirements,
      jobId,
    } = await request.json();

    if (!candidateIds || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "No candidates selected" },
        { status: 400 }
      );
    }

    if (!title || !description || !type || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type === "offline" && !venue) {
      return NextResponse.json(
        { error: "Venue is required for offline hackathons" },
        { status: 400 }
      );
    }

    // Get candidate details
    const candidates = await User.find({ userId: { $in: candidateIds } }).lean();

    const participants = candidates.map((candidate) => ({
      userId: candidate.userId,
      userName: `${candidate.firstName} ${candidate.lastName}`,
      userEmail: candidate.email,
      collegeName: candidate.collegeVerification?.collegeName,
      branch: candidate.collegeVerification?.branch,
      cgpa: candidate.collegeVerification?.cgpa,
      registeredAt: new Date(),
    }));

    // Create hackathon
    const hackathon = new Hackathon({
      recruiterId: clerkUser.id,
      recruiterName: `${dbUser.firstName} ${dbUser.lastName}`,
      companyName: dbUser.companyName || "Company",
      jobId,
      title,
      description,
      type,
      venue,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      maxParticipants,
      participants,
      status: "upcoming",
      prizes: prizes || [],
      requirements: requirements || [],
    });

    await hackathon.save();

    // TODO: Send email notifications to all participants
    console.log(`Hackathon created with ${participants.length} participants`);

    return NextResponse.json(
      {
        success: true,
        message: `Hackathon scheduled with ${participants.length} participant(s)`,
        hackathonId: hackathon._id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating hackathon:", error);
    return NextResponse.json(
      { error: "Failed to create hackathon" },
      { status: 500 }
    );
  }
}

