import { jsonError } from "@/lib/api-response";
import type { ApiErrorCode } from "@/lib/errors";

function prismaHint(code: string | undefined): string | null {
  switch (code) {
    case "P1000":
      return "Check database username and password in DATABASE_URL.";
    case "P1001":
      return "PostgreSQL is not reachable. Confirm the server is running and the host/port in DATABASE_URL.";
    case "P1012":
      return "DATABASE_URL is missing. Add it to .env or .env.local at the repo root, then restart npm run dev.";
    case "P2021":
      return 'The "Entry" table is missing. Run: npx prisma migrate dev';
    default:
      return null;
  }
}

export function handleApiError(
  error: unknown,
  fallback: string,
  code: ApiErrorCode = "INTERNAL_ERROR"
) {
  console.error(fallback, error);

  if (process.env.NODE_ENV !== "development") {
    return jsonError(fallback, code, 500);
  }

  if (error instanceof Error) {
    const prismaCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: string }).code === "string"
        ? (error as { code: string }).code
        : undefined;

    const hint = prismaHint(prismaCode);
    const detail = hint ? `${error.message}. ${hint}` : error.message;
    return jsonError(`${fallback}: ${detail}`, code, 500);
  }

  return jsonError(fallback, code, 500);
}
