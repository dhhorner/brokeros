import { createTRPCRouter } from "../trpc";
import { leadsRouter } from "./leads";
import { transactionsRouter } from "./transactions";
import { aiRouter } from "./ai";
import { billingRouter } from "./billing";

export const appRouter = createTRPCRouter({
  leads: leadsRouter,
  transactions: transactionsRouter,
  ai: aiRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
