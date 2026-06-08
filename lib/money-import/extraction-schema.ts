import { z } from "zod";

function blankStringToNull(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

const nullableNonEmptyStringSchema = z.preprocess(
  blankStringToNull,
  z.string().trim().min(1).nullable()
);

const warningListSchema = z
  .array(z.string())
  .transform((warnings) =>
    warnings
      .map((warning) => warning.trim())
      .filter((warning) => warning.length > 0)
      .map((warning) => warning.slice(0, 300))
  );

export const extractedTransactionSchema = z
  .object({
    sourceRowId: z.string().trim().min(1).max(120),
    date: nullableNonEmptyStringSchema,
    description: nullableNonEmptyStringSchema,
    amount: z.preprocess(
      blankStringToNull,
      z.coerce.number().finite().nullable()
    ),
    currency: z.preprocess(
      blankStringToNull,
      z.string().trim().min(1).max(8).nullable()
    ),
    direction: z.enum(["debit", "credit", "unknown"]),
    confidence: z.coerce.number().min(0).max(1),
    warnings: warningListSchema.default([]),
  })
  .strict();

export const statementExtractionSchema = z
  .object({
    accountName: z.preprocess(
      blankStringToNull,
      z.string().trim().min(1).max(200).nullable()
    ),
    statementPeriodStart: nullableNonEmptyStringSchema,
    statementPeriodEnd: nullableNonEmptyStringSchema,
    currency: z
      .string()
      .trim()
      .transform((currency) => currency || "USD")
      .pipe(z.string().min(1).max(8)),
    transactions: z.array(extractedTransactionSchema),
    warnings: warningListSchema,
  })
  .strict();

export const statementExtractionProviderSchema = z
  .object({
    accountName: z.string().nullable(),
    statementPeriodStart: z.string().nullable(),
    statementPeriodEnd: z.string().nullable(),
    currency: z.string(),
    transactions: z.array(
      z
        .object({
          sourceRowId: z.string(),
          date: z.string().nullable(),
          description: z.string().nullable(),
          amount: z.number().nullable(),
          currency: z.string().nullable(),
          direction: z.enum(["debit", "credit", "unknown"]),
          confidence: z.number(),
          warnings: z.array(z.string()),
        })
        .strict()
    ),
    warnings: z.array(z.string()),
  })
  .strict();

export type StatementExtractionInput = z.infer<typeof statementExtractionSchema>;
