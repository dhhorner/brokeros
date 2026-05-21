import { streamText } from "ai";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getModel } from "@/lib/ai-provider";
import { db } from "@/server/db";
import { SYSTEM_PROMPT_BASE } from "@/lib/prompts";

// Edge runtime is incompatible with Ollama (localhost) in dev — use Node runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, brokerageId } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    brokerageId?: string;
  };

  // Build context from open transactions if brokerageId provided
  let contextBlock = "";
  if (brokerageId) {
    const openDeals = await db.transaction.findMany({
      where: {
        brokerageId,
        status: { in: ["ACTIVE", "UNDER_CONTRACT", "PENDING_CLOSE"] },
      },
      select: {
        status: true,
        closeDate: true,
        property: { select: { address: true, price: true } },
        riskScore: true,
      },
      take: 10,
    });

    if (openDeals.length > 0) {
      contextBlock = `\n\nCurrent open deals for this brokerage:\n${openDeals
        .map(
          (d: { property: { address: string; price: unknown }; status: string; closeDate: Date | null; riskScore: string | null }) =>
            `- ${d.property.address} | Status: ${d.status} | Close: ${d.closeDate?.toLocaleDateString() ?? "TBD"} | Risk: ${d.riskScore ?? "N/A"}`
        )
        .join("\n")}`;
    }
  }

  const result = await streamText({
    model: getModel(),
    system: `${SYSTEM_PROMPT_BASE}${contextBlock}`,
    messages,
    maxTokens: 2048,
  });

  return result.toDataStreamResponse();
}
