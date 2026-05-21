import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMlsSyncQueue } from "@/lib/queues";

const mlsWebhookSchema = z.object({
  brokerageId: z.string().cuid(),
  source: z.string().min(1),
  listings: z.array(z.record(z.unknown())).min(1).max(500),
});

export async function POST(req: NextRequest) {
  // Basic API key auth for the webhook endpoint
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.MLS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mlsWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const job = await getMlsSyncQueue().add("mls-sync", parsed.data, {
    jobId: `mls-${parsed.data.brokerageId}-${Date.now()}`,
  });

  return NextResponse.json({ jobId: job.id, queued: true }, { status: 202 });
}
