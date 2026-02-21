import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

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
        { error: "Only recruiters can send assignments" },
        { status: 403 }
      );
    }

    const { candidateIds, subject, message, assignmentLink, deadline } = await request.json();

    if (!candidateIds || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "No candidates selected" },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Get candidate details
    const candidates = await User.find({ userId: { $in: candidateIds } }).lean();

    // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just log the emails that would be sent
    const emailsSent = candidates.map((candidate) => ({
      to: candidate.email,
      name: `${candidate.firstName} ${candidate.lastName}`,
      subject,
      message,
      assignmentLink,
      deadline,
      companyName: dbUser.companyName,
    }));

    console.log("Assignment emails to be sent:", emailsSent);

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // await sendGrid.send({
    //   to: candidate.email,
    //   from: 'noreply@yourcompany.com',
    //   subject: subject,
    //   html: emailTemplate
    // });

    return NextResponse.json(
      {
        success: true,
        message: `Assignment sent to ${candidates.length} candidate(s)`,
        emailsSent: emailsSent.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending assignments:", error);
    return NextResponse.json(
      { error: "Failed to send assignments" },
      { status: 500 }
    );
  }
}


