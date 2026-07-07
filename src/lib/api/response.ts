import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiSuccess<T>(
  data: T,
  init?: ResponseInit,
  meta?: Record<string, unknown>
) {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { status: 200, ...init });
}

export function apiCreated<T>(data: T) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccess<T>, {
    status: 201,
  });
}

export function apiError(
  message: string,
  status = 400,
  code = "BAD_REQUEST",
  details?: unknown
) {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, 401, "UNAUTHORIZED");
}

export function apiForbidden(message = "Forbidden") {
  return apiError(message, 403, "FORBIDDEN");
}

export function apiNotFound(message = "Not found") {
  return apiError(message, 404, "NOT_FOUND");
}
