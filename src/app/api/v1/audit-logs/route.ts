import { listAuditLogs } from "@/lib/audit";
import { parsePagination, requireApiAuth } from "@/lib/api/auth";
import { apiSuccess } from "@/lib/api/response";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "audit", "list");
  if (!auth.ok) return auth.response;

  const { page, limit } = parsePagination(request.nextUrl.searchParams);
  const entity = request.nextUrl.searchParams.get("entity") || undefined;

  const result = await listAuditLogs({ page, limit, entity });
  return apiSuccess(result.data, undefined, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
}
