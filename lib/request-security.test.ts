import { describe, expect, it } from "vitest";
import {
  hasAllowedRequestOrigin,
  hasJsonContentType,
  isContentLengthAllowed,
  validateMutationRequest,
} from "@/lib/request-security";

describe("request security helpers", () => {
  it("allows a configured origin header", () => {
    const headers = new Headers({ origin: "https://app.example" });

    expect(
      hasAllowedRequestOrigin(headers, {
        allowedOrigins: ["https://app.example"],
      })
    ).toBe(true);
  });

  it("falls back to a configured referer origin when origin is missing", () => {
    const headers = new Headers({
      referer: "https://app.example/dashboard?tab=entries",
    });

    expect(
      hasAllowedRequestOrigin(headers, {
        allowedOrigins: ["https://app.example"],
      })
    ).toBe(true);
  });

  it("rejects missing origin and referer information", () => {
    expect(
      hasAllowedRequestOrigin(new Headers(), {
        allowedOrigins: ["https://app.example"],
      })
    ).toBe(false);
  });

  it("allows same-origin mutations when APP_ORIGIN is not configured", () => {
    const originalAppOrigin = process.env.APP_ORIGIN;
    const originalAllowedOrigins = process.env.APP_ALLOWED_ORIGINS;
    delete process.env.APP_ORIGIN;
    delete process.env.APP_ALLOWED_ORIGINS;

    try {
      const request = new Request("http://localhost:3000/api/entries", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
      });

      expect(validateMutationRequest(request, { requireJson: true })).toBeNull();
    } finally {
      if (originalAppOrigin === undefined) {
        delete process.env.APP_ORIGIN;
      } else {
        process.env.APP_ORIGIN = originalAppOrigin;
      }

      if (originalAllowedOrigins === undefined) {
        delete process.env.APP_ALLOWED_ORIGINS;
      } else {
        process.env.APP_ALLOWED_ORIGINS = originalAllowedOrigins;
      }
    }
  });

  it("still rejects cross-origin mutations when APP_ORIGIN is not configured", () => {
    const originalAppOrigin = process.env.APP_ORIGIN;
    const originalAllowedOrigins = process.env.APP_ALLOWED_ORIGINS;
    delete process.env.APP_ORIGIN;
    delete process.env.APP_ALLOWED_ORIGINS;

    try {
      const request = new Request("http://localhost:3000/api/entries", {
        method: "POST",
        headers: {
          origin: "https://attacker.example",
          "content-type": "application/json",
        },
      });

      const response = validateMutationRequest(request, { requireJson: true });
      expect(response?.status).toBe(403);
    } finally {
      if (originalAppOrigin === undefined) {
        delete process.env.APP_ORIGIN;
      } else {
        process.env.APP_ORIGIN = originalAppOrigin;
      }

      if (originalAllowedOrigins === undefined) {
        delete process.env.APP_ALLOWED_ORIGINS;
      } else {
        process.env.APP_ALLOWED_ORIGINS = originalAllowedOrigins;
      }
    }
  });

  it("accepts JSON content types with charset parameters", () => {
    expect(
      hasJsonContentType(
        new Headers({ "content-type": "application/json; charset=utf-8" })
      )
    ).toBe(true);
  });

  it("rejects non-JSON content types", () => {
    expect(hasJsonContentType(new Headers({ "content-type": "text/plain" })))
      .toBe(false);
  });

  it("enforces content-length when present", () => {
    expect(
      isContentLengthAllowed(new Headers({ "content-length": "16384" }))
    ).toBe(true);
    expect(
      isContentLengthAllowed(new Headers({ "content-length": "16385" }))
    ).toBe(false);
  });
});
