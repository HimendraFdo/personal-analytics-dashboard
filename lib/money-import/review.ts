import type { Prisma } from "@prisma/client";
import type { MoneyImportDraft, MoneyImportSummary } from "./types";

function normalizeDuplicateTitle(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function cents(value: number) {
  return Math.round(value * 100);
}

function dateKey(value: Date | string) {
  return (value instanceof Date ? value.toISOString() : value).slice(0, 10);
}

export async function reviewMoneyImportDrafts(
  tx: Prisma.TransactionClient,
  userId: string,
  drafts: MoneyImportDraft[]
): Promise<{ drafts: MoneyImportDraft[]; summary: MoneyImportSummary }> {
  const existingEntries = await tx.entry.findMany({
    where: {
      userId,
      metricType: "money",
    },
    select: {
      title: true,
      value: true,
      date: true,
    },
  });

  const existingKeys = new Set(
    existingEntries.map(
      (entry) =>
        `${dateKey(entry.date)}|${normalizeDuplicateTitle(entry.title)}|${cents(entry.value)}`
    )
  );

  const reviewedDrafts = drafts.map((draft) => {
    const key = `${draft.date}|${normalizeDuplicateTitle(draft.title)}|${cents(draft.value)}`;
    const duplicateCandidate = existingKeys.has(key);
    return {
      ...draft,
      duplicateCandidate,
      warnings: duplicateCandidate
        ? [...draft.warnings, "Possible duplicate of an existing Money entry"]
        : draft.warnings,
    };
  });

  return {
    drafts: reviewedDrafts,
    summary: summarizeMoneyImportDrafts(reviewedDrafts),
  };
}

export function summarizeMoneyImportDrafts(
  drafts: MoneyImportDraft[]
): MoneyImportSummary {
  return {
    totalRows: drafts.length,
    importableRows: drafts.length,
    warningRows: drafts.filter((draft) => draft.warnings.length > 0).length,
    duplicateCandidateRows: drafts.filter((draft) => draft.duplicateCandidate)
      .length,
  };
}
