import type {
  MoneyImportDraft,
  RejectedImportRow,
  StatementExtraction,
} from "./types";

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 200);
}

function getStatementYear(extraction: StatementExtraction) {
  const yearSource =
    extraction.statementPeriodEnd ?? extraction.statementPeriodStart;
  const match = yearSource?.match(/\b(\d{4})\b/);
  return match ? Number(match[1]) : null;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function normalizeIsoDate(value: string | null, fallbackYear: number | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const dayMonthMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
  if (dayMonthMatch && fallbackYear) {
    const day = Number(dayMonthMatch[1]);
    const month = MONTHS[dayMonthMatch[2].toLowerCase()];

    if (day >= 1 && day <= 31 && month) {
      return `${fallbackYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
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
  const statementYear = getStatementYear(extraction);

  for (const transaction of extraction.transactions) {
    const rawDescription = transaction.description ?? undefined;
    const title = rawDescription ? normalizeTitle(redactSensitiveText(rawDescription)) : "";
    const date = normalizeIsoDate(transaction.date, statementYear);
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

    drafts.push({
      id: crypto.randomUUID(),
      date,
      title,
      value: amount,
      category: "Finance",
      note: "",
      confidence: transaction.confidence,
      duplicateCandidate: false,
      warnings,
    });
  }

  return { drafts, rejectedRows };
}
