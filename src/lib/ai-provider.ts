import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

const isDev = process.env.NODE_ENV === "development";
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

// In dev without an Anthropic key, fall back to Ollama's OpenAI-compatible endpoint
const ollamaClient = createOpenAI({
  baseURL: `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/v1`,
  apiKey: "ollama", // required by the client but ignored by Ollama
});

export function getModel() {
  if (hasAnthropicKey) {
    return anthropic("claude-sonnet-4-6");
  }
  if (isDev) {
    // Dev-only fallback — requires a running Ollama instance
    return ollamaClient("llama3.1:8b");
  }
  throw new Error(
    "No AI provider configured: set ANTHROPIC_API_KEY in your environment"
  );
}
