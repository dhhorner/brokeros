/**
 * Worker process entrypoint — run with:
 *   node --require ts-node/register src/workers/index.ts
 * or via Docker (see Dockerfile.worker)
 */
import IORedis from "ioredis";
import { createMlsSyncWorker } from "./mls-sync";
import { createDealRiskCheckWorker } from "./deal-risk-check";
import { createNurtureEmailWorker } from "./nurture-email";
import { getDealRiskCheckQueue } from "@/lib/queues";

// Load .env in non-Next.js context
import "dotenv/config";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Spin up workers ──────────────────────────────────────────────────────────
const mlsSyncWorker = createMlsSyncWorker(connection);
const dealRiskCheckWorker = createDealRiskCheckWorker(connection);
const nurtureEmailWorker = createNurtureEmailWorker(connection);

// ─── Schedule daily risk check ────────────────────────────────────────────────
const dealRiskCheckQueue = getDealRiskCheckQueue();
await dealRiskCheckQueue.upsertJobScheduler(
  "daily-risk-check",
  { pattern: "0 8 * * *" }, // 08:00 UTC every day
  {
    name: "deal-risk-check",
    data: {},
    opts: { removeOnComplete: 100, removeOnFail: 50 },
  }
);

console.log("[workers] BrokerOS workers started");
console.log("[workers] - mls-sync");
console.log("[workers] - deal-risk-check (daily @ 08:00 UTC)");
console.log("[workers] - nurture-email");

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(`[workers] Received ${signal}, shutting down gracefully...`);
  await Promise.all([
    mlsSyncWorker.close(),
    dealRiskCheckWorker.close(),
    nurtureEmailWorker.close(),
  ]);
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
