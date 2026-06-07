export type FileKind = "pdf" | "image";

export type IntakeResult = {
  runId: string;
  fileKind: FileKind;
  originalFileName: string;
  mimeType: string;
  bytes: Buffer;
};

export type ExtractedTransaction = {
  sourceRowId: string;
  date: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  direction: "debit" | "credit" | "unknown";
  confidence: number;
  warnings: string[];
};

export type StatementExtraction = {
  accountName: string | null;
  statementPeriodStart: string | null;
  statementPeriodEnd: string | null;
  currency: string;
  transactions: ExtractedTransaction[];
  warnings: string[];
};

export type MoneyImportDraft = {
  id: string;
  date: string;
  title: string;
  value: number;
  category: "Finance";
  note: string;
  confidence: number;
  duplicateCandidate: boolean;
  warnings: string[];
};

export type RejectedImportRow = {
  sourceRowId: string;
  reason: string;
  rawDescription?: string;
};

export type MoneyImportRun = {
  runId: string;
  userId: string;
  fileName: string;
  drafts: MoneyImportDraft[];
  warnings: string[];
  createdAt: number;
  expiresAt: number;
};

export type MoneyImportSummary = {
  totalRows: number;
  importableRows: number;
  warningRows: number;
  duplicateCandidateRows: number;
};
