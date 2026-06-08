import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { z } from "zod";
import type { MoneyImportRun } from "./types";

const RUN_TTL_MS = 30 * 60 * 1000;

const moneyImportDraftSchema = z
  .object({
    id: z.string().uuid(),
    date: z.string(),
    title: z.string(),
    value: z.number(),
    category: z.literal("Finance"),
    note: z.string(),
    confidence: z.number(),
    duplicateCandidate: z.boolean(),
    warnings: z.array(z.string()),
  })
  .strict();

function toRun(row: {
  id: string;
  userId: string;
  fileName: string;
  status: string;
  drafts: Prisma.JsonValue;
  warnings: Prisma.JsonValue;
  createdAt: Date;
  expiresAt: Date;
}): MoneyImportRun | null {
  const parsedDrafts = z.array(moneyImportDraftSchema).safeParse(row.drafts);
  if (!parsedDrafts.success) {
    return null;
  }

  const parsedWarnings = z.array(z.string()).safeParse(row.warnings);

  return {
    runId: row.id,
    userId: row.userId,
    fileName: row.fileName,
    drafts: parsedDrafts.data,
    warnings: parsedWarnings.success ? parsedWarnings.data : [],
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt.getTime(),
  };
}

async function pruneExpiredMoneyImportRuns(
  tx: PrismaTypes.TransactionClient,
  userId: string
) {
  await tx.moneyImportRun.deleteMany({
    where: {
      userId,
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}

export async function saveMoneyImportRun(
  tx: PrismaTypes.TransactionClient,
  run: Omit<MoneyImportRun, "createdAt" | "expiresAt">
) {
  await pruneExpiredMoneyImportRuns(tx, run.userId);

  const now = new Date();
  const storedRun = await tx.moneyImportRun.create({
    data: {
      id: run.runId,
      userId: run.userId,
      fileName: run.fileName,
      status: "requires_review",
      drafts: run.drafts as Prisma.InputJsonValue,
      warnings: run.warnings as Prisma.InputJsonValue,
      expiresAt: new Date(now.getTime() + RUN_TTL_MS),
    },
  });

  return toRun(storedRun);
}

export async function getMoneyImportRun(
  tx: PrismaTypes.TransactionClient,
  runId: string,
  userId: string
) {
  await pruneExpiredMoneyImportRuns(tx, userId);

  const run = await tx.moneyImportRun.findFirst({
    where: {
      id: runId,
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return run ? toRun(run) : null;
}

export async function deleteMoneyImportRun(
  tx: PrismaTypes.TransactionClient,
  runId: string,
  userId: string
) {
  await tx.moneyImportRun.deleteMany({
    where: {
      id: runId,
      userId,
    },
  });
}
