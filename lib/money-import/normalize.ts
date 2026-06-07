import type {
  MoneyImportDraft,
  RejectedImportRow,
  StatementExtraction,
} from "./types";

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 200);
}

function normalizeIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function redactSensitiveText(value: string) {
  return value.replace(/\b\d{6,}\b/g, "[redacted]");
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeStatementExtraction(extraction: StatementExtraction): {
  drafts: MoneyImportDraft[];
  rejectedRows: RejectedImportRow[];
} {
  const drafts: MoneyImportDraft[] = [];
  const rejectedRows: RejectedImportRow[] = [];

  for (const transaction of extraction.transactions) {
    const rawDescription = transaction.description ?? undefined;
    const title = rawDescription ? normalizeTitle(redactSensitiveText(rawDescription)) : "";
    const date = normalizeIsoDate(transaction.date);
    const amount =
      typeof transaction.amount === "number"
        ? roundMoney(Math.abs(transaction.amount))
        : null;

    if (!date) {
      rejectedRows.push({
        sourceRowId: transaction.sourceRowId,
        reason: "Missing or invalid date",
        rawDescription,
      });
      continue;
    }

    if (!title) {
      rejectedRows.push({
        sourceRowId: transaction.sourceRowId,
        reason: "Missing description",
        rawDescription,
      });
      continue;
    }

    if (!amount || amount <= 0) {
      rejectedRows.push({
        sourceRowId: transaction.sourceRowId,
        reason: "Missing or invalid amount",
        rawDescription,
      });
      continue;
    }

    const warnings = [...transaction.warnings];
    if (transaction.confidence < 0.75) {
      warnings.push("Low extraction confidence");
    }
    if (transaction.direction !== "debit") {
      warnings.push("Review non-debit transaction before importing");
    }

    const sourceParts = [
      `Imported from bank statement row ${transaction.sourceRowId}.`,
      transaction.currency || extraction.currency
        ? `Currency: ${transaction.currency ?? extraction.currency}.`
        : "",
      transaction.direction ? `Direction: ${transaction.direction}.` : "",
    ].filter(Boolean);

    drafts.push({
      id: crypto.randomUUID(),
      date,
      title,
      value: amount,
      category: "Finance",
      note: sourceParts.join(" "),
      confidence: transaction.confidence,
      duplicateCandidate: false,
      warnings,
    });
  }

  return { drafts, rejectedRows };
}
