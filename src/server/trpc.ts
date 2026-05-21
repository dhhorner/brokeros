import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { db } from "./db";

export type Context = {
  req: NextRequest;
  session: Session | null;
  db: typeof db;
};

export async function createTRPCContext(opts: {
  req: NextRequest;
}): Promise<Context> {
  const session = await auth();
  return {
    req: opts.req,
    session,
    db,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

type AuthedSession = Session & { user: NonNullable<Session["user"]> & { id: string } };

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session as AuthedSession,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware that also verifies the user belongs to a brokerage
const enforceHasBrokerage = enforceUserIsAuthed.unstable_pipe(
  async ({ ctx, next }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { brokerageId: true, role: true },
    });
    if (!user?.brokerageId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No brokerage associated with this account",
      });
    }
    return next({
      ctx: {
        ...ctx,
        brokerageId: user.brokerageId,
        userRole: user.role,
      },
    });
  }
);

export const brokerageProcedure = t.procedure.use(enforceHasBrokerage);
