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
        parties: { select: { name: true, role: true } },
        deadlines: {
          where: { completedAt: null },
          select: { type: true, dueDate: true },
          orderBy: { dueDate: "asc" },
        },
        tasks: {
          where: { status: "OPEN" },
          select: { title: true },
          take: 10,
        },
      },
      take: 10,
    });

    if (openDeals.length > 0) {
      contextBlock = `\n\nCurrent open deals for this brokerage:\n${openDeals
        .map((d) => {
          const parties = d.parties.length
            ? `  Parties: ${d.parties.map((p) => `${p.role} ${p.name}`).join(", ")}`
            : "";
          const deadlines = d.deadlines.length
            ? `  Pending deadlines: ${d.deadlines
                .map((dl) => `${dl.type} (${new Date(dl.dueDate).toLocaleDateString()})`)
                .join(", ")}`
            : "";
          const tasks = d.tasks.length
            ? `  Open tasks: ${d.tasks.map((t) => t.title).join(", ")}`
            : "";
          const lines = [
            `- ${d.property.address} | Status: ${d.status} | Close: ${d.closeDate?.toLocaleDateString() ?? "TBD"} | Risk: ${d.riskScore ?? "N/A"}`,
            parties,
            deadlines,
            tasks,
          ]
            .filter(Boolean)
            .join("\n");
          return lines;
        })
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
