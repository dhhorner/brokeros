import { streamText } from "ai";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getModel } from "@/lib/ai-provider";
import { draftEmailSchema } from "@/lib/schemas/ai";
import { EMAIL_DRAFT_SYSTEM_PROMPT, buildEmailDraftPrompt } from "@/lib/prompts";

// Edge runtime is incompatible with Ollama (localhost) in dev — use Node runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = draftEmailSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error.flatten()), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await streamText({
    model: getModel(),
    system: EMAIL_DRAFT_SYSTEM_PROMPT,
    prompt: buildEmailDraftPrompt(parsed.data),
    maxTokens: 1024,
  });

  return result.toDataStreamResponse();
}
