import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/lib/errors";

export function jsonError(
  message: string,
  code: ApiErrorCode,
  status: number,
  init?: ResponseInit
) {
  return NextResponse.json(
    { error: { message, code } },
    { ...init, status }
  );
}
