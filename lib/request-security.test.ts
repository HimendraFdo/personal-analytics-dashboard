import { describe, expect, it } from "vitest";
import {
  hasAllowedRequestOrigin,
  hasJsonContentType,
  isContentLengthAllowed,
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
