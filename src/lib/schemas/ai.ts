import { z } from "zod";

export const draftEmailSchema = z.object({
  context: z.string().min(1).max(2000),
  tone: z.enum(["professional", "friendly"]),
  recipientRole: z.string().min(1).max(100),
});

export const summarizeDealSchema = z.object({
  transactionId: z.string().cuid(),
});

export const suggestTasksSchema = z.object({
  transactionId: z.string().cuid(),
  stage: z.string().min(1).max(100),
});

export const suggestedTaskSchema = z.object({
  title: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  rationale: z.string(),
});

export const suggestTasksResponseSchema = z.object({
  tasks: z.array(suggestedTaskSchema),
});

export type DraftEmailInput = z.infer<typeof draftEmailSchema>;
export type SummarizeDealInput = z.infer<typeof summarizeDealSchema>;
export type SuggestTasksInput = z.infer<typeof suggestTasksSchema>;
export type SuggestedTask = z.infer<typeof suggestedTaskSchema>;
