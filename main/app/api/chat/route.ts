import { NextResponse } from "next/server";
import { chatWithProvider, getActiveProvider } from "@/lib/chat-providers";

const SYSTEM_PROMPT = `You are a helpful career assistant for HEXjuy's - a student professional network (LinkedIn clone for students). 
You help students with:
- Career advice and job search tips
- Resume and profile improvement suggestions
- Interview preparation
- Networking and professional growth
- Understanding ATS (Applicant Tracking Systems) and how to optimize resumes

Be friendly, concise, and actionable. Keep responses focused and helpful. If asked about the platform, mention it's for students to connect, find jobs, and grow professionally.`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const provider = getActiveProvider();
    if (!provider) {
      return NextResponse.json(
        { error: "No AI provider configured. Set KIMI_K2_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const text = await chatWithProvider(messages, SYSTEM_PROMPT);

    return NextResponse.json({ message: text, provider });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
