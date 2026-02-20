/**
 * Multi-provider chat support: Gemini, Kimi K2, OpenAI
 * Kimi K2: OpenAI-compatible API, supports $web_search for real-time web results
 * Docs: https://kimi-k2.ai/api-docs
 */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatProvider = "gemini" | "kimi" | "openai";

export function getActiveProvider(): ChatProvider | null {
  if (process.env.KIMI_K2_API_KEY) return "kimi";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export async function chatWithProvider(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const provider = getActiveProvider();
  if (!provider) {
    throw new Error("No AI provider configured. Set KIMI_K2_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY.");
  }

  if (provider === "kimi") {
    return chatWithKimi(messages, systemPrompt);
  }
  if (provider === "openai") {
    return chatWithOpenAI(messages, systemPrompt);
  }
  return chatWithGemini(messages, systemPrompt);
}

async function chatWithKimi(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.KIMI_K2_API_KEY;
  if (!apiKey) throw new Error("KIMI_K2_API_KEY not set");

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });

  const formatted = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  const response = await openai.chat.completions.create({
    model: process.env.KIMI_MODEL || "moonshotai/kimi-k2.5",
    messages: formatted,
    max_tokens: 2048,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function chatWithOpenAI(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const openai = new OpenAI({ apiKey });

  const formatted = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: formatted,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function chatWithGemini(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

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
  return result.response.text();
}
