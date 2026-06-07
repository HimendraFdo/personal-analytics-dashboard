import { z } from "zod";

export const extractedTransactionSchema = z
  .object({
    sourceRowId: z.string().trim().min(1).max(120),
    date: z.string().trim().min(1).nullable(),
    description: z.string().trim().min(1).nullable(),
    amount: z.coerce.number().finite().nullable(),
    currency: z.string().trim().min(1).max(8).nullable(),
    direction: z.enum(["debit", "credit", "unknown"]),
    confidence: z.coerce.number().min(0).max(1),
    warnings: z.array(z.string().trim().min(1).max(300)).default([]),
  })
  .strict();

export const statementExtractionSchema = z
  .object({
    accountName: z.string().trim().min(1).max(200).nullable(),
    statementPeriodStart: z.string().trim().min(1).nullable(),
    statementPeriodEnd: z.string().trim().min(1).nullable(),
    currency: z.string().trim().min(1).max(8),
    transactions: z.array(extractedTransactionSchema),
    warnings: z.array(z.string().trim().min(1).max(300)),
  })
  .strict();

export type StatementExtractionInput = z.infer<typeof statementExtractionSchema>;
