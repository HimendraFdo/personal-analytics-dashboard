import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/lib/errors";

export function jsonError(
  message: string,
  code: ApiErrorCode,
  status: number
) {
  return NextResponse.json({ error: { message, code } }, { status });
}
