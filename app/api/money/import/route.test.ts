import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetMemoryRateLimitStoreForTests } from "@/lib/rate-limit";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  readStatement: vi.fn(),
  entryCreate: vi.fn(),
  entryFindMany: vi.fn(),
  importRunCreate: vi.fn(),
  importRunDeleteMany: vi.fn(),
  importRunFindFirst: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  withRlsUserContext: (_userId: string, callback: (tx: unknown) => unknown) =>
    callback({
      entry: {
        create: mocks.entryCreate,
        findMany: mocks.entryFindMany,
      },
      moneyImportRun: {
        create: mocks.importRunCreate,
        deleteMany: mocks.importRunDeleteMany,
        findFirst: mocks.importRunFindFirst,
      },
    }),
}));

vi.mock("@/lib/money-import/statement-reader", () => ({
  readStatement: mocks.readStatement,
}));

import { POST as UPLOAD } from "./route";
import { POST as COMMIT } from "./[runId]/commit/route";

const userId = "user_123";
const appOrigin = "http://localhost";
const originalAppOrigin = process.env.APP_ORIGIN;
const originalMaxFileMb = process.env.MONEY_IMPORT_MAX_FILE_MB;
const runId = "123e4567-e89b-12d3-a456-426614174000";
const draftId = "123e4567-e89b-12d3-a456-426614174001";

function uploadRequest(file: File, headers: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("file", file);

  return new NextRequest("http://localhost/api/money/import", {
    method: "POST",
    body: formData,
    headers: {
      origin: appOrigin,
      ...headers,
    },
  });
}

function validPngFile() {
  return new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    "statement.png",
    { type: "image/png" }
  );
}

function commitRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/money/import/${runId}/commit`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      origin: appOrigin,
      "content-type": "application/json",
      ...headers,
    },
  });
}

async function readJson(response: Response) {
  return response.json();
}

function validDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: draftId,
    date: "2026-05-16",
    title: "Coffee Shop",
    value: 12.5,
    category: "Finance",
    note: "Imported from bank statement row 1.",
    confidence: 0.95,
    duplicateCandidate: false,
    warnings: [],
    ...overrides,
  };
}

function storedRun(overrides: Record<string, unknown> = {}) {
  return {
    id: runId,
    userId,
    fileName: "statement.png",
    status: "requires_review",
    drafts: [validDraft()],
    createdAt: new Date("2026-06-07T00:00:00.000Z"),
    expiresAt: new Date("2026-06-07T00:30:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  process.env.APP_ORIGIN = appOrigin;
  delete process.env.APP_ALLOWED_ORIGINS;
  process.env.MONEY_IMPORT_MAX_FILE_MB = "10";
  mocks.auth.mockResolvedValue({ userId });
  mocks.entryFindMany.mockResolvedValue([]);
  mocks.importRunDeleteMany.mockResolvedValue({ count: 0 });
  mocks.importRunCreate.mockImplementation(async ({ data }) =>
    storedRun({
      id: data.id,
      userId: data.userId,
      fileName: data.fileName,
      drafts: data.drafts,
      expiresAt: data.expiresAt,
    })
  );
});

afterEach(() => {
  vi.clearAllMocks();
  resetMemoryRateLimitStoreForTests();

  if (originalAppOrigin === undefined) {
    delete process.env.APP_ORIGIN;
  } else {
    process.env.APP_ORIGIN = originalAppOrigin;
  }

  if (originalMaxFileMb === undefined) {
    delete process.env.MONEY_IMPORT_MAX_FILE_MB;
  } else {
    process.env.MONEY_IMPORT_MAX_FILE_MB = originalMaxFileMb;
  }
});

describe("money import upload route", () => {
  it("rejects unauthenticated uploads", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const response = await UPLOAD(
      uploadRequest(new File(["fake"], "statement.png", { type: "image/png" }))
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    expect(mocks.readStatement).not.toHaveBeenCalled();
  });

  it("rejects unsupported mime types", async () => {
    const response = await UPLOAD(
      uploadRequest(new File(["fake"], "statement.txt", { type: "text/plain" }))
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Unsupported statement file type",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.readStatement).not.toHaveBeenCalled();
  });

  it("rejects supported mime types when the content does not match", async () => {
    const response = await UPLOAD(
      uploadRequest(new File(["fake"], "statement.png", { type: "image/png" }))
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Statement file type does not match content",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.readStatement).not.toHaveBeenCalled();
  });

  it("rejects files larger than the money import limit", async () => {
    process.env.MONEY_IMPORT_MAX_FILE_MB = "0.000001";

    const response = await UPLOAD(
      uploadRequest(new File(["too-large"], "statement.png", { type: "image/png" }))
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Statement file is too large",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.readStatement).not.toHaveBeenCalled();
  });

  it("returns an extraction error for malformed structured output", async () => {
    mocks.readStatement.mockRejectedValue(
      new Error("Statement extraction returned invalid data")
    );

    const response = await UPLOAD(uploadRequest(validPngFile()));

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Failed to extract statement",
        code: "INTERNAL_ERROR",
      },
    });
  });

  it("returns reviewable drafts for a successful extraction", async () => {
    mocks.readStatement.mockResolvedValue({
      accountName: null,
      statementPeriodStart: null,
      statementPeriodEnd: null,
      currency: "USD",
      transactions: [
        {
          sourceRowId: "row-1",
          date: "2026-05-16",
          description: "Coffee Shop",
          amount: -12.5,
          currency: "USD",
          direction: "debit",
          confidence: 0.95,
          warnings: [],
        },
      ],
      warnings: [],
    });

    const response = await UPLOAD(uploadRequest(validPngFile()));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      runId: expect.any(String),
      status: "requires_review",
      fileName: "statement.png",
      summary: {
        totalRows: 1,
        importableRows: 1,
        warningRows: 0,
        duplicateCandidateRows: 0,
      },
      drafts: [
        expect.objectContaining({
          date: "2026-05-16",
          title: "Coffee Shop",
          value: 12.5,
          category: "Finance",
          duplicateCandidate: false,
        }),
      ],
      warnings: [],
    });
    expect(mocks.importRunCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        fileName: "statement.png",
        status: "requires_review",
      }),
    });
    expect(mocks.entryCreate).not.toHaveBeenCalled();
  });
});

describe("money import commit route", () => {
  it("rejects unauthenticated commits", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const response = await COMMIT(
      commitRequest({ draftIds: [draftId] }),
      { params: Promise.resolve({ runId }) }
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    expect(mocks.entryCreate).not.toHaveBeenCalled();
  });

  it("creates money entries for selected drafts", async () => {
    mocks.importRunFindFirst.mockResolvedValue(storedRun());
    mocks.entryCreate.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174099",
      userId,
      title: "Coffee Shop",
      value: 12.5,
      metricType: "money",
      category: "Finance",
      date: new Date("2026-05-16T00:00:00.000Z"),
      note: "Imported from bank statement row 1.",
      foodName: null,
      portionGrams: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      foodSource: null,
      createdAt: new Date("2026-06-07T00:00:00.000Z"),
      updatedAt: new Date("2026-06-07T00:00:00.000Z"),
    });

    const response = await COMMIT(
      commitRequest({ draftIds: [draftId] }),
      { params: Promise.resolve({ runId }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.importRunFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: runId, userId }),
      })
    );
    expect(mocks.entryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        metricType: "money",
        category: "Finance",
        title: "Coffee Shop",
        value: 12.5,
      }),
    });
    expect(await readJson(response)).toEqual({
      importedEntryIds: ["123e4567-e89b-12d3-a456-426614174099"],
      skippedDraftIds: [],
    });
  });

  it("does not let another user commit a run they do not own", async () => {
    mocks.importRunFindFirst.mockResolvedValue(null);

    const response = await COMMIT(
      commitRequest({ draftIds: [draftId] }),
      { params: Promise.resolve({ runId }) }
    );

    expect(response.status).toBe(404);
    expect(mocks.importRunFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: runId, userId }),
      })
    );
    expect(mocks.entryCreate).not.toHaveBeenCalled();
  });

  it("revalidates edited draft values server-side", async () => {
    mocks.importRunFindFirst.mockResolvedValue(storedRun());

    const response = await COMMIT(
      commitRequest({
        draftIds: [draftId],
        drafts: [
          {
            id: draftId,
            date: "not-a-date",
            title: "Coffee Shop",
            value: 12.5,
            note: "Edited note",
          },
        ],
      }),
      { params: Promise.resolve({ runId }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.entryCreate).not.toHaveBeenCalled();
    expect(await readJson(response)).toEqual({
      importedEntryIds: [],
      skippedDraftIds: [draftId],
    });
  });

  it("accepts full client draft payloads from the review table", async () => {
    mocks.importRunFindFirst.mockResolvedValue(storedRun());
    mocks.entryCreate.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174099",
      userId,
      title: "Edited Coffee Shop",
      value: 10,
      metricType: "money",
      category: "Finance",
      date: new Date("2026-05-16T00:00:00.000Z"),
      note: "Edited note",
      foodName: null,
      portionGrams: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      foodSource: null,
      createdAt: new Date("2026-06-07T00:00:00.000Z"),
      updatedAt: new Date("2026-06-07T00:00:00.000Z"),
    });

    const response = await COMMIT(
      commitRequest({
        draftIds: [draftId],
        drafts: [
          {
            id: draftId,
            date: "2026-05-16",
            title: "Edited Coffee Shop",
            value: 10,
            category: "Finance",
            note: "Edited note",
            confidence: 0.95,
            duplicateCandidate: false,
            warnings: [],
          },
        ],
      }),
      { params: Promise.resolve({ runId }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.entryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metricType: "money",
        category: "Finance",
        title: "Edited Coffee Shop",
        value: 10,
      }),
    });
    expect(await readJson(response)).toEqual({
      importedEntryIds: ["123e4567-e89b-12d3-a456-426614174099"],
      skippedDraftIds: [],
    });
  });
});
