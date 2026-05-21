import { TRPCError } from "@trpc/server";
import { createTRPCRouter, brokerageProcedure } from "../trpc";
import { draftEmailSchema, summarizeDealSchema, suggestTasksSchema, suggestTasksResponseSchema } from "@/lib/schemas/ai";
import { getModel } from "@/lib/ai-provider";
import {
  EMAIL_DRAFT_SYSTEM_PROMPT,
  DEAL_SUMMARY_SYSTEM_PROMPT,
  TASK_SUGGESTION_SYSTEM_PROMPT,
  buildEmailDraftPrompt,
  buildDealSummaryPrompt,
  buildTaskSuggestionPrompt,
} from "@/lib/prompts";
import { generateText } from "ai";

export const aiRouter = createTRPCRouter({
  // draftEmail is handled as a streaming API route — see /api/ai/draft-email
  // This tRPC procedure provides a non-streaming fallback
  draftEmail: brokerageProcedure
    .input(draftEmailSchema)
    .mutation(async ({ input }) => {
      const { text } = await generateText({
        model: getModel(),
        system: EMAIL_DRAFT_SYSTEM_PROMPT,
        prompt: buildEmailDraftPrompt(input),
        maxTokens: 1024,
      });
      return { draft: text };
    }),

  summarizeDeal: brokerageProcedure
    .input(summarizeDealSchema)
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.transactionId, brokerageId: ctx.brokerageId },
        select: {
          status: true,
          closeDate: true,
          purchasePrice: true,
          property: { select: { address: true, price: true } },
          parties: { select: { role: true, name: true } },
          deadlines: {
            select: { type: true, dueDate: true, completedAt: true },
            orderBy: { dueDate: "asc" },
          },
          tasks: {
            select: { title: true, completedAt: true },
            where: { status: "OPEN" },
          },
        },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { text } = await generateText({
        model: getModel(),
        system: DEAL_SUMMARY_SYSTEM_PROMPT,
        prompt: buildDealSummaryPrompt({
          property: {
            address: transaction.property.address,
            price: transaction.property.price.toString(),
          },
          status: transaction.status,
          closeDate: transaction.closeDate?.toISOString() ?? null,
          parties: transaction.parties.map((p) => ({
            role: p.role,
            name: p.name,
          })),
          deadlines: transaction.deadlines.map((d) => ({
            type: d.type,
            dueDate: d.dueDate.toISOString(),
            completedAt: d.completedAt?.toISOString() ?? null,
          })),
          tasks: transaction.tasks.map((t) => ({
            title: t.title,
            completedAt: t.completedAt?.toISOString() ?? null,
          })),
        }),
        maxTokens: 1024,
      });

      return { summary: text };
    }),

  suggestTasks: brokerageProcedure
    .input(suggestTasksSchema)
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.transactionId, brokerageId: ctx.brokerageId },
        select: {
          status: true,
          property: { select: { address: true } },
          deadlines: {
            where: { completedAt: null },
            select: { type: true, dueDate: true },
          },
          tasks: {
            where: { status: "OPEN" },
            select: { title: true },
          },
        },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { text } = await generateText({
        model: getModel(),
        system: TASK_SUGGESTION_SYSTEM_PROMPT,
        prompt: buildTaskSuggestionPrompt({
          stage: input.stage,
          address: transaction.property.address,
          status: transaction.status,
          openDeadlines: transaction.deadlines.map(
            (d) => `${d.type} (due ${d.dueDate.toLocaleDateString()})`
          ),
          openTasks: transaction.tasks.map((t) => t.title),
        }),
        maxTokens: 1024,
      });

      const parsed = JSON.parse(text) as unknown;
      return suggestTasksResponseSchema.parse(parsed);
    }),
});
