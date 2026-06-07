import type { FileKind, IntakeResult } from "./types";

const ALLOWED_MIME_TYPES: Record<string, FileKind> = {
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
};

export const DEFAULT_MONEY_IMPORT_MAX_FILE_MB = 10;

function hasPrefix(bytes: Buffer, prefix: number[]) {
  if (bytes.length < prefix.length) {
    return false;
  }

  return prefix.every((byte, index) => bytes[index] === byte);
}

function matchesDeclaredMimeType(bytes: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") {
    return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  }

  if (mimeType === "image/png") {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (mimeType === "image/jpeg") {
    return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  }

  return false;
}

export function getMoneyImportMaxFileBytes() {
  const configured = Number(process.env.MONEY_IMPORT_MAX_FILE_MB);
  const mb =
    Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_MONEY_IMPORT_MAX_FILE_MB;
  return mb * 1024 * 1024;
}

export async function intakeStatementFile(file: File): Promise<IntakeResult> {
  const fileKind = ALLOWED_MIME_TYPES[file.type];

  if (!fileKind) {
    throw new Error("Unsupported statement file type");
  }

  if (file.size <= 0) {
    throw new Error("Statement file is empty");
  }

  if (file.size > getMoneyImportMaxFileBytes()) {
    throw new Error("Statement file is too large");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesDeclaredMimeType(bytes, file.type)) {
    throw new Error("Statement file type does not match content");
  }

  return {
    runId: crypto.randomUUID(),
    fileKind,
    originalFileName: file.name || "statement",
    mimeType: file.type,
    bytes,
  };
}
