import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
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
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
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
    expect(mocks.updateMany).not.toHaveBeenCalled();
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
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });
});

describe("entry API ownership enforcement", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["GET", () => GET(new NextRequest("http://localhost/api/entries"))],
    [
      "POST",
      () =>
        POST(
          jsonRequest("http://localhost/api/entries", {
            title: "Study session",
            value: 45,
            metricType: "time",
            category: "Study",
            date: "2026-05-16",
          })
        ),
    ],
    [
      "PATCH",
      () =>
        PATCH_ENTRY(
          jsonRequest(
            "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000",
            { title: "Updated" }
          ),
          {
            params: Promise.resolve({
              id: "123e4567-e89b-12d3-a456-426614174000",
            }),
          }
        ),
    ],
    [
      "DELETE",
      () =>
        DELETE_ENTRY(
          new NextRequest(
            "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000",
            { method: "DELETE" }
          ),
          {
            params: Promise.resolve({
              id: "123e4567-e89b-12d3-a456-426614174000",
            }),
          }
        ),
    ],
  ])("returns 401 for unauthenticated %s requests", async (_method, act) => {
    mocks.auth.mockResolvedValue({ userId: null });

    const response = await act();

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("scopes entry list reads to the authenticated user", async () => {
    mocks.auth.mockResolvedValue({ userId });
    mocks.findMany.mockResolvedValue([]);

    const response = await GET(new NextRequest("http://localhost/api/entries"));

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId }),
      })
    );
  });

  it("always stores the authenticated userId when creating entries", async () => {
    mocks.auth.mockResolvedValue({ userId });
    mocks.create.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId,
      title: "Study session",
      value: 45,
      metricType: "time",
      category: "Study",
      date: new Date("2026-05-16T00:00:00.000Z"),
      note: "",
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
        title: "Study session",
        value: 45,
        metricType: "time",
        category: "Study",
        date: "2026-05-16",
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId }),
    });
  });

  it("rejects create requests that try to set ownership", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await POST(
      jsonRequest("http://localhost/api/entries", {
        userId: "user_attacker",
        title: "Study session",
        value: 45,
        metricType: "time",
        category: "Study",
        date: "2026-05-16",
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects update requests that try to change ownership", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await PATCH_ENTRY(
      jsonRequest(
        "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000",
        { userId: "user_attacker", title: "Updated" }
      ),
      {
        params: Promise.resolve({
          id: "123e4567-e89b-12d3-a456-426614174000",
        }),
      }
    );

    expect(response.status).toBe(400);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("does not update another user's entry", async () => {
    mocks.auth.mockResolvedValue({ userId });
    mocks.findFirst.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId,
      title: "Study session",
      value: 45,
      metricType: "time",
      category: "Study",
      date: new Date("2026-05-16T00:00:00.000Z"),
      note: "",
      foodName: null,
      portionGrams: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      foodSource: null,
      createdAt: new Date("2026-05-16T00:00:00.000Z"),
      updatedAt: new Date("2026-05-16T00:00:00.000Z"),
    });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH_ENTRY(
      jsonRequest(
        "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000",
        { title: "Updated" }
      ),
      {
        params: Promise.resolve({
          id: "123e4567-e89b-12d3-a456-426614174000",
        }),
      }
    );

    expect(response.status).toBe(404);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        userId,
      },
      data: expect.objectContaining({ title: "Updated" }),
    });
  });

  it("does not delete another user's entry", async () => {
    mocks.auth.mockResolvedValue({ userId });
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    const response = await DELETE_ENTRY(
      new NextRequest(
        "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000",
        { method: "DELETE" }
      ),
      {
        params: Promise.resolve({
          id: "123e4567-e89b-12d3-a456-426614174000",
        }),
      }
    );

    expect(response.status).toBe(404);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        userId,
      },
    });
  });
});
