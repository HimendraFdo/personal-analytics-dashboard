import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    entry: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      update: mocks.update,
      delete: mocks.delete,
    },
  },
}));

import { GET, POST } from "./route";
import {
  DELETE as DELETE_ENTRY,
  PATCH as PATCH_ENTRY,
} from "./[id]/route";

const userId = "user_123";

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function readJson(response: Response) {
  return response.status === 204 ? null : response.json();
}

describe("entry API SQL injection safety", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malicious sort values before querying entries", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/entries?sort=date_desc%3B%20DELETE%20FROM%20Entry"
      )
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Invalid sort parameter",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("rejects malicious category values before querying entries", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/entries?category=Study%27%20OR%201%3D1%20--"
      )
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Invalid category",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("stores SQL-looking title and note text as data", async () => {
    mocks.auth.mockResolvedValue({ userId });
    mocks.create.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId,
      title: "' OR 1=1 --",
      value: 45,
      metricType: "time",
      category: "Study",
      date: new Date("2026-05-16T00:00:00.000Z"),
      note: "Robert'); DELETE FROM Entry; --",
      foodName: null,
      portionGrams: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      foodSource: null,
      createdAt: new Date("2026-05-16T00:00:00.000Z"),
      updatedAt: new Date("2026-05-16T00:00:00.000Z"),
    });

    const response = await POST(
      jsonRequest("http://localhost/api/entries", {
        title: "' OR 1=1 --",
        value: 45,
        metricType: "time",
        category: "Study",
        date: "2026-05-16",
        note: "Robert'); DELETE FROM Entry; --",
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        title: "' OR 1=1 --",
        note: "Robert'); DELETE FROM Entry; --",
      }),
    });
  });

  it("returns 400 for invalid UUID route params in PATCH", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await PATCH_ENTRY(
      jsonRequest("http://localhost/api/entries/not-a-uuid", { title: "New" }),
      { params: Promise.resolve({ id: "' OR 1=1 --" }) }
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Invalid entry id",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid UUID route params in DELETE", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await DELETE_ENTRY(
      new NextRequest("http://localhost/api/entries/not-a-uuid", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "' OR 1=1 --" }) }
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Invalid entry id",
        code: "VALIDATION_ERROR",
      },
    });
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
