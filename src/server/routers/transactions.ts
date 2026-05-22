import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, brokerageProcedure } from "../trpc";
import {
  createTransactionSchema,
  updateTransactionStatusSchema,
  createPartySchema,
  createDeadlineSchema,
  completeDeadlineSchema,
  createTaskSchema,
  completeTaskSchema,
  createWithPropertySchema,
} from "@/lib/schemas/transaction";
import { computeRiskScore } from "@/lib/risk-engine";

const transactionSelect = {
  id: true,
  status: true,
  closeDate: true,
  purchasePrice: true,
  earnestMoney: true,
  riskScore: true,
  riskFlags: true,
  createdAt: true,
  property: {
    select: {
      id: true,
      address: true,
      price: true,
      beds: true,
      baths: true,
      sqft: true,
      status: true,
    },
  },
} as const;

const transactionDetailSelect = {
  ...transactionSelect,
  parties: {
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  deadlines: {
    select: {
      id: true,
      type: true,
      dueDate: true,
      completedAt: true,
      notes: true,
    },
    orderBy: { dueDate: "asc" as const },
  },
  tasks: {
    select: {
      id: true,
      title: true,
      dueDate: true,
      completedAt: true,
      assignedTo: true,
      status: true,
    },
    orderBy: { dueDate: "asc" as const },
  },
  documents: {
    select: {
      id: true,
      name: true,
      url: true,
      type: true,
      uploadedAt: true,
    },
  },
} as const;

export const transactionsRouter = createTRPCRouter({
  create: brokerageProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify property belongs to this brokerage
      const property = await ctx.db.property.findFirst({
        where: { id: input.propertyId, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!property) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
      }

      return ctx.db.transaction.create({
        data: {
          brokerageId: ctx.brokerageId,
          propertyId: input.propertyId,
          buyerId: input.buyerId,
          sellerId: input.sellerId,
          closeDate: input.closeDate ? new Date(input.closeDate) : null,
          purchasePrice: input.purchasePrice,
          earnestMoney: input.earnestMoney,
        },
        select: transactionSelect,
      });
    }),

  list: brokerageProcedure
    .input(
      z.object({
        status: z
          .enum(["ACTIVE", "UNDER_CONTRACT", "PENDING_CLOSE", "CLOSED", "CANCELLED"])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction.findMany({
        where: {
          brokerageId: ctx.brokerageId,
          ...(input.status && { status: input.status }),
        },
        select: {
          ...transactionSelect,
          parties: {
            select: { id: true, role: true, name: true },
            take: 4,
          },
          _count: {
            select: {
              deadlines: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  getById: brokerageProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: transactionDetailSelect,
      });
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return transaction;
    }),

  updateStatus: brokerageProcedure
    .input(updateTransactionStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.transaction.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.transaction.update({
        where: { id: input.id },
        data: { status: input.status },
        select: { id: true, status: true },
      });
    }),

  // ─── Parties ───────────────────────────────────────────────────────────────

  addParty: brokerageProcedure
    .input(createPartySchema)
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.transactionId, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.transactionParty.create({
        data: {
          ...input,
          email: input.email || null,
        },
        select: { id: true, role: true, name: true, email: true, phone: true },
      });
    }),

  // ─── Deadlines ─────────────────────────────────────────────────────────────

  createDeadline: brokerageProcedure
    .input(createDeadlineSchema)
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.transactionId, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.contingencyDeadline.create({
        data: {
          transactionId: input.transactionId,
          type: input.type,
          dueDate: new Date(input.dueDate),
          notes: input.notes,
        },
        select: {
          id: true,
          type: true,
          dueDate: true,
          completedAt: true,
          notes: true,
        },
      });
    }),

  completeDeadline: brokerageProcedure
    .input(completeDeadlineSchema)
    .mutation(async ({ ctx, input }) => {
      const deadline = await ctx.db.contingencyDeadline.findFirst({
        where: {
          id: input.id,
          transaction: { brokerageId: ctx.brokerageId },
        },
        select: { id: true },
      });
      if (!deadline) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.contingencyDeadline.update({
        where: { id: input.id },
        data: { completedAt: new Date() },
        select: { id: true, completedAt: true },
      });
    }),

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  createTask: brokerageProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.transactionId) {
        const transaction = await ctx.db.transaction.findFirst({
          where: { id: input.transactionId, brokerageId: ctx.brokerageId },
          select: { id: true },
        });
        if (!transaction) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      return ctx.db.task.create({
        data: {
          brokerageId: ctx.brokerageId,
          transactionId: input.transactionId,
          title: input.title,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          assignedTo: input.assignedTo,
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          assignedTo: true,
        },
      });
    }),

  completeTask: brokerageProcedure
    .input(completeTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.task.update({
        where: { id: input.id },
        data: { completedAt: new Date(), status: "COMPLETED" },
        select: { id: true, completedAt: true, status: true },
      });
    }),

  // ─── Create deal + property atomically ────────────────────────────────────

  createWithProperty: brokerageProcedure
    .input(createWithPropertySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const property = await tx.property.create({
          data: {
            brokerageId: ctx.brokerageId,
            address: input.address,
            price: input.listPrice,
            beds: input.beds ?? null,
            baths: input.baths ?? null,
            sqft: input.sqft ?? null,
          },
          select: { id: true },
        });
        return tx.transaction.create({
          data: {
            brokerageId: ctx.brokerageId,
            propertyId: property.id,
            closeDate: input.closeDate ? new Date(input.closeDate) : null,
            purchasePrice: input.purchasePrice ?? null,
            earnestMoney: input.earnestMoney ?? null,
          },
          select: transactionSelect,
        });
      });
    }),

  // ─── Manual risk check ────────────────────────────────────────────────────

  runRiskCheck: brokerageProcedure
    .mutation(async ({ ctx }) => {
      const openTransactions = await ctx.db.transaction.findMany({
        where: {
          brokerageId: ctx.brokerageId,
          status: { in: ["ACTIVE", "UNDER_CONTRACT", "PENDING_CLOSE"] },
        },
        include: { deadlines: true },
      });

      for (const transaction of openTransactions) {
        const { score, flags } = computeRiskScore(transaction);
        await ctx.db.transaction.update({
          where: { id: transaction.id },
          data: { riskScore: score, riskFlags: flags },
        });
      }

      return { checked: openTransactions.length };
    }),

  // ─── Tasks across all transactions ────────────────────────────────────────

  listTasks: brokerageProcedure
    .input(z.object({ status: z.enum(["OPEN", "COMPLETED"]).default("OPEN") }))
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          brokerageId: ctx.brokerageId,
          status: input.status,
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          completedAt: true,
          status: true,
          assignedTo: true,
          transaction: {
            select: {
              id: true,
              property: { select: { address: true } },
            },
          },
        },
        orderBy:
          input.status === "COMPLETED"
            ? [{ completedAt: "desc" }]
            : [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 100,
      });
    }),
});
