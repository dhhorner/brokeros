import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient, type Prisma } from "@prisma/client";
import type { MlsSyncJobData } from "@/lib/queues";

const db = new PrismaClient();

export function createMlsSyncWorker(connection: IORedis) {
  return new Worker<MlsSyncJobData>(
    "mls-sync",
    async (job: Job<MlsSyncJobData>) => {
      const { brokerageId, listings, source } = job.data;
      console.log(
        `[mls-sync] Processing ${listings.length} listings for brokerage ${brokerageId} from ${source}`
      );

      let upserted = 0;
      let errors = 0;

      for (const listing of listings) {
        try {
          const mlsId = String(listing.mlsId ?? listing.id ?? "");
          const address = String(listing.address ?? listing.streetAddress ?? "");
          const price = Number(listing.listPrice ?? listing.price ?? 0);

          if (!mlsId || !address) {
            console.warn(`[mls-sync] Skipping listing with missing mlsId or address`);
            continue;
          }

          await db.property.upsert({
            where: { mlsId },
            create: {
              brokerageId,
              mlsId,
              address,
              price,
              beds: listing.beds != null ? Number(listing.beds) : null,
              baths: listing.baths != null ? Number(listing.baths) : null,
              sqft: listing.sqft != null ? Number(listing.sqft) : null,
              status: mapMlsStatus(String(listing.status ?? "ACTIVE")),
              listedAt: listing.listedAt ? new Date(String(listing.listedAt)) : null,
              rawData: listing as Prisma.InputJsonValue,
            },
            update: {
              address,
              price,
              beds: listing.beds != null ? Number(listing.beds) : null,
              baths: listing.baths != null ? Number(listing.baths) : null,
              sqft: listing.sqft != null ? Number(listing.sqft) : null,
              status: mapMlsStatus(String(listing.status ?? "ACTIVE")),
              rawData: listing as Prisma.InputJsonValue,
            },
          });
          upserted++;
        } catch (err) {
          console.error(`[mls-sync] Error upserting listing:`, err);
          errors++;
        }
      }

      console.log(
        `[mls-sync] Done. Upserted: ${upserted}, Errors: ${errors}`
      );
      return { upserted, errors };
    },
    { connection }
  );
}

function mapMlsStatus(raw: string): "ACTIVE" | "PENDING" | "SOLD" | "EXPIRED" | "WITHDRAWN" {
  const normalized = raw.toUpperCase();
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "SOLD" || normalized === "CLOSED") return "SOLD";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (normalized === "WITHDRAWN" || normalized === "CANCELLED") return "WITHDRAWN";
  return "ACTIVE";
}
