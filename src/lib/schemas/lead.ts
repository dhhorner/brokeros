import { z } from "zod";
import { LeadStatus, LeadSource } from "@prisma/client";

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  status: z.nativeEnum(LeadStatus).default("NEW"),
  source: z.nativeEnum(LeadSource).default("MANUAL"),
  assignedTo: z.string().cuid().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().cuid(),
});

export const listLeadsSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedTo: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().cuid().optional(),
});

