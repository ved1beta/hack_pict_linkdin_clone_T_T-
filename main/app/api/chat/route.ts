import { NextResponse } from "next/server";
import { chatWithProvider } from "@/lib/chat-providers";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/mongodb/db";
import { ParsedResume } from "@/mongodb/models/parsedResume";
import { ResumeUpload } from "@/mongodb/models/resumeUpload";
import { User } from "@/mongodb/models/user";

const BASE_SYSTEM_PROMPT = `You are a helpful career assistant for HEXLink — a student professional network. 
You help students with:
- Career advice and job search tips
- Resume and profile improvement suggestions
- Interview preparation
- Networking and professional growth
- Understanding ATS (Applicant Tracking Systems) and how to optimize resumes

Be friendly, concise, and actionable. Keep responses focused and helpful.`;

async function getResumeContext(userId: string): Promise<string> {
  try {
    await connectDB();
    
    const [dbUser, latestUpload] = await Promise.all([
      User.findOne({ userId }).lean(),
      ResumeUpload.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    let context = "";

    if (dbUser) {
      const u = dbUser as any;
      if (u.firstName || u.lastName) {
        context += `\nUser: ${u.firstName || ""} ${u.lastName || ""}`.trim();
      }
      if (u.skills && u.skills.length > 0) {
        context += `\nProfile Skills: ${u.skills.join(", ")}`;
      }
      if (u.bio) {
        context += `\nBio: ${u.bio}`;
      }
    }

    if (latestUpload) {
      const parsed = await ParsedResume.findOne({ resumeUploadId: (latestUpload as any)._id }).lean();
      if (parsed) {
        const p = parsed as any;
        if (p.skills && p.skills.length > 0) {
          context += `\nResume Skills: ${p.skills.join(", ")}`;
        }
        if (p.workExperience && p.workExperience.length > 0) {
          context += `\nWork Experience: ${p.workExperience.map((w: any) => `${w.role || ""} at ${w.company || ""} (${w.duration || ""})`).join("; ")}`;
        }
        if (p.education && p.education.length > 0) {
          context += `\nEducation: ${p.education.map((e: any) => `${e.degree || ""} from ${e.institution || ""} (${e.year || ""})`).join("; ")}`;
        }
      }
    }

    return context;
  } catch (error) {
    console.error("Failed to fetch resume context:", error);
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // OpenRouter is always available with hardcoded API key

    // Try to get user context from resume
    let resumeContext = "";
    try {
      const clerkUser = await currentUser();
      if (clerkUser?.id) {
        resumeContext = await getResumeContext(clerkUser.id);
      }
    } catch {
      // Non-critical: continue without resume context
    }

    const systemPrompt = resumeContext
      ? `${BASE_SYSTEM_PROMPT}\n\nHere is the user's profile and resume information for context (use this to give personalized advice):\n${resumeContext}`
      : BASE_SYSTEM_PROMPT;

    const text = await chatWithProvider(messages, systemPrompt);

    return NextResponse.json({ message: text, provider: "openrouter" });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
