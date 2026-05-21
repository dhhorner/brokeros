import "server-only";
import { createCallerFactory, createTRPCContext } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(async () => {
  const hdrs = await headers();
  return createTRPCContext({
    req: new Request("http://internal", {
      headers: hdrs,
    }) as NextRequest,
  });
});
