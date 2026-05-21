import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

const isDev = process.env.NODE_ENV === "development";

// In dev, use Ollama's OpenAI-compatible endpoint — no API key needed
const ollamaClient = createOpenAI({
  baseURL: `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/v1`,
  apiKey: "ollama", // required by the client but ignored by Ollama
});

export function getModel() {
  if (isDev) {
    return ollamaClient("llama3.1:8b");
  }
  return anthropic("claude-sonnet-4-6");
}
