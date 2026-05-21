import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type Lead, type User } from "@prisma/client";
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
      const { status, source, assignedTo, limit, cursor } = input;

      const leads = await ctx.db.lead.findMany({
        where: {
          brokerageId: ctx.brokerageId,
          ...(status && { status }),
          ...(source && { source }),
          ...(assignedTo && { assignedTo }),
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
            },
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return lead;
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
});
