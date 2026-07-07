import { getAuthContext } from "@/lib/auth";
import type { Action, Resource } from "@/lib/permissions";
import { hasEntityPermission } from "@/lib/permissions";
import { clientRateLimitKey, rateLimit } from "./rate-limit";
import { apiForbidden, apiUnauthorized } from "./response";

export async function requireApiAuth(
  request: Request,
  resource: Resource,
  action: Action
) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { ok: false as const, response: apiUnauthorized() };
  }

  const limit = rateLimit(clientRateLimitKey(request, ctx.userId));
  if (!limit.ok) {
    return {
      ok: false as const,
      response: apiUnauthorized(`Rate limit exceeded. Retry in ${limit.retryAfter}s`),
    };
  }

  if (!hasEntityPermission(ctx.role, resource, action)) {
    return {
      ok: false as const,
      response: apiForbidden(`Permission denied: ${resource}:${action}`),
    };
  }

  return { ok: true as const, ctx };
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
    100
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
