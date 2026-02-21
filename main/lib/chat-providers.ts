/**
 * Chat provider using OpenRouter API
 * Docs: https://openrouter.ai/docs/quickstart
 */

import { chatCompletion } from "./openrouter";

export async function chatWithProvider(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const formatted = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
  ];

  return chatCompletion(formatted);
}
