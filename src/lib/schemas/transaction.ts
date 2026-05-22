import { z } from "zod";
import {
  TransactionStatus,
  PartyRole,
  ContingencyType,
} from "@prisma/client";

export const createTransactionSchema = z.object({
  propertyId: z.string().cuid(),
  buyerId: z.string().optional(),
  sellerId: z.string().optional(),
  closeDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  earnestMoney: z.number().positive().optional(),
});

export const updateTransactionStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(TransactionStatus),
});

export const createPartySchema = z.object({
  transactionId: z.string().cuid(),
  role: z.nativeEnum(PartyRole),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
});

export const createDeadlineSchema = z.object({
  transactionId: z.string().cuid(),
  type: z.nativeEnum(ContingencyType),
  dueDate: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export const completeDeadlineSchema = z.object({
  id: z.string().cuid(),
});

export const createTaskSchema = z.object({
  transactionId: z.string().cuid().optional(),
  title: z.string().min(1).max(200),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().cuid().optional(),
});

export const completeTaskSchema = z.object({
  id: z.string().cuid(),
});

export const createWithPropertySchema = z.object({
  address: z.string().min(1, "Address is required").max(300),
  listPrice: z.number().positive("List price must be positive"),
  beds: z.number().int().min(0).optional(),
  baths: z.number().min(0).optional(),
  sqft: z.number().int().min(0).optional(),
  closeDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  earnestMoney: z.number().positive().optional(),
});

