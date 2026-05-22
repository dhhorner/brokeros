import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, brokerageProcedure } from "../trpc";
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsSchema,
} from "@/lib/schemas/lead";

export const leadsRouter = createTRPCRouter({
  create: brokerageProcedure
    .input(createLeadSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.create({
        data: {
          ...input,
          email: input.email || null,
          brokerageId: ctx.brokerageId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          assignedTo: true,
          createdAt: true,
        },
      });
    }),

  list: brokerageProcedure
    .input(listLeadsSchema)
    .query(async ({ ctx, input }) => {
      const { status, source, assignedTo, search, limit, cursor } = input;

      const leads = await ctx.db.lead.findMany({
        where: {
          brokerageId: ctx.brokerageId,
          ...(status && { status }),
          ...(source && { source }),
          ...(assignedTo && { assignedTo }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          assignedTo: true,
          createdAt: true,
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (leads.length > limit) {
        const next = leads.pop();
        nextCursor = next?.id;
      }

      return { leads, nextCursor };
    }),

  getById: brokerageProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          notes: true,
          assignedTo: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            select: { id: true, name: true, email: true },
          },
          sequences: {
            select: {
              id: true,
              status: true,
              currentStep: true,
              nextSendAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return lead;
    }),

  delete: brokerageProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lead.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.lead.delete({ where: { id: input.id } });
    }),

  update: brokerageProcedure
    .input(updateLeadSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.lead.findFirst({
        where: { id, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.lead.update({
        where: { id },
        data: {
          ...data,
          email: data.email === "" ? null : data.email,
          assignedTo: data.assignedTo ?? null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          source: true,
          assignedTo: true,
          updatedAt: true,
        },
      });
    }),

  // ─── Brokerage members (for assignee picker) ─────────────────────────────

  brokerageMembers: brokerageProcedure
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        where: { brokerageId: ctx.brokerageId },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
    }),

  // ─── Nurture sequences ────────────────────────────────────────────────────

  startSequence: brokerageProcedure
    .input(z.object({ leadId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.leadId, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.nurtureSequence.create({
        data: {
          brokerageId: ctx.brokerageId,
          leadId: input.leadId,
          status: "ACTIVE",
          currentStep: 0,
          nextSendAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
        },
        select: {
          id: true,
          status: true,
          currentStep: true,
          nextSendAt: true,
          createdAt: true,
        },
      });
    }),

  pauseSequence: brokerageProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const seq = await ctx.db.nurtureSequence.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.nurtureSequence.update({
        where: { id: input.id },
        data: { status: "PAUSED" },
        select: { id: true, status: true },
      });
    }),

  cancelSequence: brokerageProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const seq = await ctx.db.nurtureSequence.findFirst({
        where: { id: input.id, brokerageId: ctx.brokerageId },
        select: { id: true },
      });
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.nurtureSequence.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
        select: { id: true, status: true },
      });
    }),
});
