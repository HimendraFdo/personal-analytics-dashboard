import { Buffer } from "node:buffer";

type SecurityHeaderOptions = {
  appOrigin?: string;
  clerkFrontendApiUrl?: string;
  clerkPublishableKey?: string;
  environment?: string;
};

export type SecurityHeader = {
  key: string;
  value: string;
};

// Narrow Clerk fallback for local/test environments where the publishable key
// is unavailable or placeholder-only; real deployments should derive or set
// the exact frontend API host.
const FALLBACK_CLERK_FRONTEND_API = "https://*.clerk.accounts.dev";
const CLOUDFLARE_CHALLENGES = "https://challenges.cloudflare.com";
const CLERK_IMAGES = "https://img.clerk.com";

function compactCsp(directives: string[]): string {
  return directives
    .map((directive) => directive.trim())
    .filter(Boolean)
    .join("; ");
}

function normalizeUrlOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function decodeClerkPublishableKey(value: string | undefined): string | null {
  const payload = value?.replace(/^pk_(test|live)_/, "").trim();

  if (!payload || payload === value) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    return normalizeUrlOrigin(decoded.replace(/\$$/, ""));
  } catch {
    return null;
  }
}

function getClerkFrontendApiSource(options: SecurityHeaderOptions): string {
  return (
    normalizeUrlOrigin(options.clerkFrontendApiUrl) ??
    decodeClerkPublishableKey(options.clerkPublishableKey) ??
    FALLBACK_CLERK_FRONTEND_API
  );
}

function isLocalHttpOrigin(value: string | undefined): boolean {
  const origin = normalizeUrlOrigin(value);

  return (
    origin === "http://localhost" ||
    origin?.startsWith("http://localhost:") ||
    origin === "http://127.0.0.1" ||
    origin?.startsWith("http://127.0.0.1:") ||
    origin === "http://[::1]" ||
    origin?.startsWith("http://[::1]:") ||
    false
  );
}

export function buildContentSecurityPolicy(
  options: SecurityHeaderOptions = {}
): string {
  const isDevelopment = options.environment !== "production";
  const clerkFrontendApi = getClerkFrontendApiSource(options);
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : "",
    clerkFrontendApi,
    CLOUDFLARE_CHALLENGES,
  ];
  const connectSources = [
    "'self'",
    clerkFrontendApi,
    isDevelopment ? "http://localhost:*" : "",
    isDevelopment ? "ws://localhost:*" : "",
    isDevelopment ? "http://127.0.0.1:*" : "",
    isDevelopment ? "ws://127.0.0.1:*" : "",
  ];
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https: " + CLERK_IMAGES,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSources.filter(Boolean).join(" ")}`,
    `connect-src ${connectSources.filter(Boolean).join(" ")}`,
    `frame-src 'self' ${CLOUDFLARE_CHALLENGES}`,
    "worker-src 'self' blob:",
    "form-action 'self'",
    isDevelopment ? "" : "upgrade-insecure-requests",
  ];

  return compactCsp(directives);
}

export function getSecurityHeaders(
  options: SecurityHeaderOptions = {}
): SecurityHeader[] {
  const environment = options.environment ?? process.env.NODE_ENV;
  const appOrigin = options.appOrigin ?? process.env.APP_ORIGIN;
  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy({
        ...options,
        environment,
        appOrigin,
        clerkFrontendApiUrl:
          options.clerkFrontendApiUrl ?? process.env.CLERK_FRONTEND_API_URL,
        clerkPublishableKey:
          options.clerkPublishableKey ??
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      }),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
  ];

  if (environment === "production" && !isLocalHttpOrigin(appOrigin)) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}
