import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_for_build");

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const dbUser = await User.findByUserId(clerkUser.id);
    
    if (!dbUser || dbUser.userType !== "recruiter") {
      return NextResponse.json({ error: "Only recruiters can schedule" }, { status: 403 });
    }

    const { 
      candidateId, 
      candidateEmail, 
      candidateName, 
      companyName, 
      jobId, 
      scheduledAt, 
      notes 
    } = await req.json();

    if (!candidateId || !companyName || !scheduledAt || !candidateEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const candidate = await User.findByUserId(candidateId);
    
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Add interview to candidate's profile
    if (!candidate.interviews) {
      candidate.interviews = [];
    }

    candidate.interviews.push({
      companyName,
      jobId,
      scheduledAt: new Date(scheduledAt),
      status: 'SCHEDULED',
      notes: notes || '',
      createdAt: new Date()
    });

    await candidate.save();

    // Send email notification
    const interviewDate = new Date(scheduledAt);
    const formattedDate = interviewDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = interviewDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    try {
      await resend.emails.send({
        from: 'HEXjuy\'s <onboarding@resend.dev>',
        to: candidateEmail,
        subject: `Interview Scheduled with ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📅 Interview Scheduled!</h1>
                </div>
                <div class="content">
                  <p>Hi ${candidateName || 'there'},</p>
                  
                  <p>Great news! <strong>${companyName}</strong> has scheduled an interview with you.</p>
                  
                  <div class="info-box">
                    <p><strong>🗓️ Date:</strong> ${formattedDate}</p>
                    <p><strong>🕐 Time:</strong> ${formattedTime}</p>
                    <p><strong>🏢 Company:</strong> ${companyName}</p>
                    ${notes ? `<p><strong>📝 Notes:</strong> ${notes}</p>` : ''}
                  </div>
                  
                  <p><strong>Preparation Tips:</strong></p>
                  <ul>
                    <li>Research the company and role</li>
                    <li>Prepare questions to ask the interviewer</li>
                    <li>Review your resume and be ready to discuss your experience</li>
                    <li>Test your video/call setup if it's a remote interview</li>
                  </ul>
                  
                  <p>Good luck! We're rooting for you! 🎉</p>
                  
                  <div class="footer">
                    <p>This email was sent by HEXjuy's Platform</p>
                    <p>If you have questions, please contact ${companyName} directly</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Interview scheduled for ${formattedDate} at ${formattedTime}`,
    });
  } catch (error) {
    console.error("Schedule interview error:", error);
    return NextResponse.json(
      { error: "Failed to schedule interview" },
      { status: 500 }
    );
  }
}
