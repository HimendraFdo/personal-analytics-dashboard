export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONFIGURATION_ERROR"
  | "EXTRACTION_PROVIDER_ERROR"
  | "EXTRACTION_VALIDATION_ERROR"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "NOT_FOUND"
  | "CONFLICT"
  | "METHOD_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: {
    message: string;
    code: ApiErrorCode;
  };
};

export function getErrorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    body.error &&
    typeof body.error === "object" &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }
  return fallback;
}
