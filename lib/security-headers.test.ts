import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from "@/lib/security-headers";

function clerkPublishableKey(frontendApiHost: string): string {
  return `pk_test_${Buffer.from(`${frontendApiHost}$`, "utf8").toString(
    "base64url"
  )}`;
}

function headerValue(headers: { key: string; value: string }[], key: string) {
  return headers.find((header) => header.key === key)?.value;
}

describe("security headers", () => {
  it("builds the required browser hardening headers", () => {
    const headers = getSecurityHeaders({
      appOrigin: "https://app.example",
      clerkFrontendApiUrl: "https://steady-fox-12.clerk.accounts.dev",
      environment: "production",
    });

    expect(headerValue(headers, "Content-Security-Policy")).toContain(
      "frame-ancestors 'none'"
    );
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(headerValue(headers, "Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    );
    expect(headerValue(headers, "X-Frame-Options")).toBe("DENY");
  });

  it("keeps development-only CSP allowances out of production", () => {
    const csp = buildContentSecurityPolicy({
      clerkFrontendApiUrl: "https://steady-fox-12.clerk.accounts.dev",
      environment: "production",
    });

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("ws://localhost:*");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows Next.js development eval and local websocket connections only in development", () => {
    const csp = buildContentSecurityPolicy({
      clerkFrontendApiUrl: "https://steady-fox-12.clerk.accounts.dev",
      environment: "development",
    });

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://localhost:*");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("derives the Clerk frontend API host from the publishable key", () => {
    const csp = buildContentSecurityPolicy({
      clerkPublishableKey: clerkPublishableKey(
        "steady-fox-12.clerk.accounts.dev"
      ),
      environment: "production",
    });

    expect(csp).toContain("https://steady-fox-12.clerk.accounts.dev");
  });

  it("sets HSTS in production except for explicit local HTTP origins", () => {
    expect(
      headerValue(
        getSecurityHeaders({
          appOrigin: "https://app.example",
          clerkFrontendApiUrl: "https://steady-fox-12.clerk.accounts.dev",
          environment: "production",
        }),
        "Strict-Transport-Security"
      )
    ).toBe("max-age=31536000; includeSubDomains");

    expect(
      headerValue(
        getSecurityHeaders({
          appOrigin: "http://localhost:3000",
          clerkFrontendApiUrl: "https://steady-fox-12.clerk.accounts.dev",
          environment: "production",
        }),
        "Strict-Transport-Security"
      )
    ).toBeUndefined();
  });
});
