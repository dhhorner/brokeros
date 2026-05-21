import { Queue } from "bullmq";
import IORedis from "ioredis";

// ─── Job payload types ───────────────────────────────────────────────────────

export type MlsSyncJobData = {
  brokerageId: string;
  listings: Array<Record<string, unknown>>;
  source: string;
};

export type DealRiskCheckJobData = {
  brokerageId?: string;
};

export type NurtureEmailJobData = {
  sequenceId: string;
  leadId: string;
  step: number;
};

// ─── Lazy connection + queue factories ───────────────────────────────────────
// Queues are not instantiated until first use to avoid connecting Redis
// during Next.js build-time module evaluation.

let _conn: IORedis | null = null;

function conn(): IORedis {
  if (!_conn) {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is not set");
    }
    _conn = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _conn;
}

let _mlsSyncQueue: Queue<MlsSyncJobData> | null = null;
let _dealRiskCheckQueue: Queue<DealRiskCheckJobData> | null = null;
let _nurtureEmailQueue: Queue<NurtureEmailJobData> | null = null;

export function getMlsSyncQueue(): Queue<MlsSyncJobData> {
  _mlsSyncQueue ??= new Queue<MlsSyncJobData>("mls-sync", {
    connection: conn(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
  return _mlsSyncQueue;
}

export function getDealRiskCheckQueue(): Queue<DealRiskCheckJobData> {
  _dealRiskCheckQueue ??= new Queue<DealRiskCheckJobData>("deal-risk-check", {
    connection: conn(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
  return _dealRiskCheckQueue;
}

export function getNurtureEmailQueue(): Queue<NurtureEmailJobData> {
  _nurtureEmailQueue ??= new Queue<NurtureEmailJobData>("nurture-email", {
    connection: conn(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 10000 },
    },
  });
  return _nurtureEmailQueue;
}
