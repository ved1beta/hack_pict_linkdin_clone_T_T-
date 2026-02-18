import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Map client messages to Gemini format (user/assistant -> user/model)
    const mapped = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const lastMsg = mapped[mapped.length - 1];
    const history = mapped.slice(0, -1);

    const chat = model.startChat({
      history: history.map((c: { role: string; parts: { text: string }[] }) => ({
        role: c.role as "user" | "model",
        parts: c.parts,
      })),
    });

    const result = await chat.sendMessage(lastMsg.parts[0].text);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
