import { jsonError } from "@/lib/api-response";

export const DEFAULT_MAX_JSON_BODY_BYTES = 16 * 1024;

type RequestSecurityOptions = {
  allowedOrigins?: string[];
  maxContentLengthBytes?: number;
  requireJson?: boolean;
};

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));
}

function normalizeOrigin(value: string | null | undefined): string | null {
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

function getConfiguredAllowedOrigins(): string[] {
  const explicitOrigins = parseOrigins(process.env.APP_ALLOWED_ORIGINS);
  const singleOrigin = parseOrigins(process.env.APP_ORIGIN);
  const vercelOrigin = parseOrigins(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  return [...new Set([...explicitOrigins, ...singleOrigin, ...vercelOrigin])];
}

function getAllowedOrigins(options: RequestSecurityOptions): Set<string> {
  return new Set(options.allowedOrigins ?? getConfiguredAllowedOrigins());
}

function getRequestUrlOrigin(request: Request): string | null {
  return normalizeOrigin(request.url);
}

function getRefererOrigin(headers: Headers): string | null {
  const referer = headers.get("referer");

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function hasAllowedRequestOrigin(
  headers: Headers,
  options: RequestSecurityOptions = {}
): boolean {
  const allowedOrigins = getAllowedOrigins(options);
  const origin = normalizeOrigin(headers.get("origin"));
  const refererOrigin = origin ? null : getRefererOrigin(headers);
  const requestOrigin = origin ?? refererOrigin;

  if (!requestOrigin) {
    return false;
  }

  return allowedOrigins.has(requestOrigin);
}

export function hasJsonContentType(headers: Headers): boolean {
  const contentType = headers.get("content-type");

  if (!contentType) {
    return false;
  }

  return contentType.split(";")[0]?.trim().toLowerCase() === "application/json";
}

export function isContentLengthAllowed(
  headers: Headers,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): boolean {
  const contentLength = headers.get("content-length");

  if (!contentLength) {
    return true;
  }

  const bytes = Number(contentLength);
  return Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= maxBytes;
}

export function validateMutationRequest(
  request: Request,
  options: RequestSecurityOptions = {}
): Response | null {
  const configuredOrigins = options.allowedOrigins ?? getConfiguredAllowedOrigins();
  const requestUrlOrigin = getRequestUrlOrigin(request);
  const allowedOrigins =
    configuredOrigins.length > 0
      ? configuredOrigins
      : requestUrlOrigin
        ? [requestUrlOrigin]
        : [];

  if (!hasAllowedRequestOrigin(request.headers, { ...options, allowedOrigins })) {
    return jsonError("Forbidden", "FORBIDDEN", 403);
  }

  if (options.requireJson && !hasJsonContentType(request.headers)) {
    return jsonError(
      "Unsupported media type",
      "UNSUPPORTED_MEDIA_TYPE",
      415
    );
  }

  if (
    !isContentLengthAllowed(
      request.headers,
      options.maxContentLengthBytes ?? DEFAULT_MAX_JSON_BODY_BYTES
    )
  ) {
    return jsonError("Payload too large", "PAYLOAD_TOO_LARGE", 413);
  }

  return null;
}
