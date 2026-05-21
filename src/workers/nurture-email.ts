import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import type { NurtureEmailJobData } from "@/lib/queues";

export function createNurtureEmailWorker(connection: IORedis) {
  return new Worker<NurtureEmailJobData>(
    "nurture-email",
    async (job: Job<NurtureEmailJobData>) => {
      const { sequenceId, leadId, step } = job.data;

      // Stub: wire Resend + sequence logic here
      console.log(
        `[nurture-email] Sending step ${step} for lead ${leadId} in sequence ${sequenceId}`
      );

      // TODO: fetch sequence config, render email template, send via Resend
      // const { data, error } = await resend.emails.send({ ... });

      return { sent: true, sequenceId, leadId, step };
    },
    { connection }
  );
}
