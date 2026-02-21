/**
 * OpenRouter API client - unified interface for all AI models
 * Docs: https://openrouter.ai/docs/quickstart
 */

import OpenAI from "openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

// Initialize OpenAI SDK with OpenRouter endpoint
export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourapp.com", // Optional
    "X-Title": "LinkedIn Clone", // Optional
  },
});

// Default model to use - using free models to avoid credit issues
// See free models: https://openrouter.ai/models?max_price=0
export const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

/**
 * Chat completion with OpenRouter
 * Uses free models to avoid credit issues
 */
export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const response = await openrouter.chat.completions.create({
      model: options?.model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1024, // Reduced to avoid credit issues
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error: any) {
    console.error("OpenRouter API error:", error);
    
    // If it's a credit issue or model not found, try with a different free model
    if (error.status === 402 || error.code === 402 || error.status === 404 || error.code === 404) {
      console.log("Retrying with alternative free model...");
      try {
        const retryResponse = await openrouter.chat.completions.create({
          model: "google/gemma-3-12b-it:free",
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: Math.min(options?.maxTokens || 1024, 800),
        });
        return retryResponse.choices[0]?.message?.content?.trim() || "";
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
      }
    }
    
    throw error;
  }
}

/**
 * Generate embeddings using OpenRouter
 * Note: Most embedding models require credits. For free tier, we'll use a fallback.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Try to use embedding model (requires credits)
    const response = await openrouter.embeddings.create({
      model: "openai/text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.warn("Embedding API failed, using fallback:", error.message);
    // Fallback: Generate simple hash-based embedding for free tier
    return generateSimpleEmbedding(text);
  }
}

/**
 * Simple fallback embedding for free tier
 * Creates a basic vector representation of text
 */
function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // Standard embedding size
  
  words.forEach((word, idx) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const position = (charCode + idx) % embedding.length;
      embedding[position] += 1 / (words.length + 1);
    }
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

/**
 * Structured JSON output with OpenRouter
 */
export async function structuredCompletion<T>(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<T> {
  try {
    const response = await openrouter.chat.completions.create({
      model: options?.model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature || 0.3,
      max_tokens: 1024, // Reduced for free tier
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content?.trim() || "{}";
    return JSON.parse(content) as T;
  } catch (error: any) {
    console.error("OpenRouter structured completion error:", error);
    
    // Retry with free model if credit issue or model not found
    if (error.status === 402 || error.code === 402 || error.status === 404 || error.code === 404) {
      console.log("Retrying structured completion with free model...");
      try {
        const retryResponse = await openrouter.chat.completions.create({
          model: "google/gemma-3-12b-it:free",
          messages,
          temperature: options?.temperature || 0.3,
          max_tokens: 800,
        });
        const content = retryResponse.choices[0]?.message?.content?.trim() || "{}";
        return JSON.parse(content) as T;
      } catch (retryError) {
        console.error("Retry failed:", retryError);
      }
    }
    
    throw error;
  }
}

