import { logAudit } from "@/lib/audit";
import { requireApiAuth } from "@/lib/api/auth";
import {
  getEntityConfig,
  getPrismaDelegate,
  parseEntityId,
  teacherScopeWhere,
} from "@/lib/api/entities";
import { apiError, apiNotFound, apiSuccess } from "@/lib/api/response";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { entity: string; id: string } }
) {
  const config = getEntityConfig(params.entity);
  if (!config) return apiNotFound("Unknown entity");

  const auth = await requireApiAuth(request, config.resource, "read");
  if (!auth.ok) return auth.response;

  const id = parseEntityId(config, params.id);
  if (id == null) return apiError("Invalid id", 400);

  const delegate = getPrismaDelegate(config);
  const scope = teacherScopeWhere(config, auth.ctx.userId, auth.ctx.role);

  const record = await (delegate as { findFirst: (args: object) => Promise<unknown> }).findFirst({
    where: { id, ...scope },
    include: config.listInclude,
  });

  if (!record) return apiNotFound();

  return apiSuccess(record);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { entity: string; id: string } }
) {
  const config = getEntityConfig(params.entity);
  if (!config) return apiNotFound("Unknown entity");

  const auth = await requireApiAuth(request, config.resource, "delete");
  if (!auth.ok) return auth.response;

  const id = parseEntityId(config, params.id);
  if (id == null) return apiError("Invalid id", 400);

  const delegate = getPrismaDelegate(config);
  const scope = teacherScopeWhere(config, auth.ctx.userId, auth.ctx.role);

  const existing = await (delegate as { findFirst: (args: object) => Promise<unknown> }).findFirst({
    where: { id, ...scope },
  });

  if (!existing) return apiNotFound();

  await delegate.delete({ where: { id } });

  await logAudit({
    userId: auth.ctx.userId,
    userRole: auth.ctx.role,
    action: "DELETE",
    entity: config.resource,
    entityId: id,
  });

  return apiSuccess({ deleted: true, id });
}
