import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { computeRiskScore } from "@/lib/risk-engine";
import type { DealRiskCheckJobData } from "@/lib/queues";

const db = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export function createDealRiskCheckWorker(connection: IORedis) {
  return new Worker<DealRiskCheckJobData>(
    "deal-risk-check",
    async (job: Job<DealRiskCheckJobData>) => {
      const { brokerageId } = job.data;
      console.log(
        `[deal-risk-check] Running risk check${brokerageId ? ` for brokerage ${brokerageId}` : " for all brokerages"}`
      );

      const openTransactions = await db.transaction.findMany({
        where: {
          status: { in: ["ACTIVE", "UNDER_CONTRACT", "PENDING_CLOSE"] },
          ...(brokerageId && { brokerageId }),
        },
        include: {
          deadlines: true,
          brokerage: {
            include: {
              owner: { select: { email: true, name: true } },
            },
          },
          property: { select: { address: true } },
        },
      });

      let checked = 0;
      let escalated = 0;

      for (const transaction of openTransactions) {
        const { score, flags } = computeRiskScore(transaction);
        const previousScore = transaction.riskScore;

        await db.transaction.update({
          where: { id: transaction.id },
          data: { riskScore: score, riskFlags: flags },
        });

        // Alert broker when score escalates to HIGH
        if (score === "HIGH" && previousScore !== "HIGH") {
          const brokerEmail = transaction.brokerage.owner.email;
          const brokerName = transaction.brokerage.owner.name ?? "Broker";

          try {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL ?? "noreply@brokeros.app",
              to: brokerEmail,
              subject: `[BrokerOS] High Risk Alert: ${transaction.property.address}`,
              html: buildRiskAlertEmail({
                brokerName,
                address: transaction.property.address,
                flags,
                transactionId: transaction.id,
              }),
            });
            escalated++;
          } catch (err) {
            console.error(
              `[deal-risk-check] Failed to send alert for transaction ${transaction.id}:`,
              err
            );
          }
        }

        checked++;
      }

      console.log(
        `[deal-risk-check] Done. Checked: ${checked}, Escalated to HIGH: ${escalated}`
      );
      return { checked, escalated };
    },
    { connection }
  );
}

function buildRiskAlertEmail(params: {
  brokerName: string;
  address: string;
  flags: string[];
  transactionId: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `
    <h2>High Risk Alert for ${params.address}</h2>
    <p>Hi ${params.brokerName},</p>
    <p>A transaction requires your immediate attention:</p>
    <ul>
      ${params.flags.map((f) => `<li>${f}</li>`).join("")}
    </ul>
    <p><a href="${appUrl}/dashboard/deals/${params.transactionId}">View Transaction →</a></p>
    <p>— BrokerOS</p>
  `;
}
