import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetMemoryRateLimitStoreForTests } from "@/lib/rate-limit";

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
const appOrigin = "http://localhost";
const originalAppOrigin = process.env.APP_ORIGIN;

function jsonRequest(
  url: string,
  body: unknown,
  init: { method?: string; headers?: Record<string, string> } = {}
): NextRequest {
  const bodyText = JSON.stringify(body);

  return new NextRequest(url, {
    method: init.method ?? "POST",
    body: bodyText,
    headers: {
      origin: appOrigin,
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

function deleteRequest(
  url: string,
  headers: Record<string, string> = { origin: appOrigin }
): NextRequest {
  return new NextRequest(url, {
    method: "DELETE",
    headers,
  });
}

async function readJson(response: Response) {
  return response.status === 204 ? null : response.json();
}

beforeEach(() => {
  process.env.APP_ORIGIN = appOrigin;
  delete process.env.APP_ALLOWED_ORIGINS;
});

afterEach(() => {
  if (originalAppOrigin === undefined) {
    delete process.env.APP_ORIGIN;
  } else {
    process.env.APP_ORIGIN = originalAppOrigin;
  }
});

describe("entry API SQL injection safety", () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetMemoryRateLimitStoreForTests();
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
      jsonRequest(
        "http://localhost/api/entries/not-a-uuid",
        { title: "New" },
        { method: "PATCH" }
      ),
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
      deleteRequest("http://localhost/api/entries/not-a-uuid"),
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
    resetMemoryRateLimitStoreForTests();
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
            { title: "Updated" },
            { method: "PATCH" }
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
          deleteRequest(
            "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000"
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
        { userId: "user_attacker", title: "Updated" },
        { method: "PATCH" }
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
        { title: "Updated" },
        { method: "PATCH" }
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
      deleteRequest(
        "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000"
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

describe("entry API request hardening", () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetMemoryRateLimitStoreForTests();
  });

  it("allows valid same-origin create mutations", async () => {
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
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("rejects invalid origin create mutations", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await POST(
      jsonRequest(
        "http://localhost/api/entries",
        {
          title: "Study session",
          value: 45,
          metricType: "time",
          category: "Study",
          date: "2026-05-16",
        },
        { headers: { origin: "https://attacker.example" } }
      )
    );

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({
      error: { message: "Forbidden", code: "FORBIDDEN" },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects mutation requests without origin or referer", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await POST(
      new NextRequest("http://localhost/api/entries", {
        method: "POST",
        body: JSON.stringify({
          title: "Study session",
          value: 45,
          metricType: "time",
          category: "Study",
          date: "2026-05-16",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON content type before parsing", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await POST(
      new NextRequest("http://localhost/api/entries", {
        method: "POST",
        body: "{}",
        headers: { origin: appOrigin, "content-type": "text/plain" },
      })
    );

    expect(response.status).toBe(415);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Unsupported media type",
        code: "UNSUPPORTED_MEDIA_TYPE",
      },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects oversized JSON bodies before parsing", async () => {
    mocks.auth.mockResolvedValue({ userId });

    const response = await POST(
      new NextRequest("http://localhost/api/entries", {
        method: "POST",
        body: "{}",
        headers: {
          origin: appOrigin,
          "content-type": "application/json",
          "content-length": "16385",
        },
      })
    );

    expect(response.status).toBe(413);
    expect(await readJson(response)).toEqual({
      error: { message: "Payload too large", code: "PAYLOAD_TOO_LARGE" },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("accepts application/json with charset", async () => {
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
      jsonRequest(
        "http://localhost/api/entries",
        {
          title: "Study session",
          value: 45,
          metricType: "time",
          category: "Study",
          date: "2026-05-16",
        },
        { headers: { "content-type": "application/json; charset=utf-8" } }
      )
    );

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("does not require JSON content type for DELETE without a body", async () => {
    mocks.auth.mockResolvedValue({ userId });
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    const response = await DELETE_ENTRY(
      deleteRequest(
        "http://localhost/api/entries/123e4567-e89b-12d3-a456-426614174000"
      ),
      {
        params: Promise.resolve({
          id: "123e4567-e89b-12d3-a456-426614174000",
        }),
      }
    );

    expect(response.status).toBe(204);
    expect(mocks.deleteMany).toHaveBeenCalledOnce();
  });
});
