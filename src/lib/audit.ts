import prisma from "./prisma";
import { logger } from "./logger";
import type { UserRole } from "./auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntry = {
  userId: string;
  userRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId?: string | number | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        userRole: entry.userRole,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId != null ? String(entry.entityId) : null,
        changes: entry.changes ?? undefined,
        ipAddress: entry.ipAddress ?? undefined,
        userAgent: entry.userAgent ?? undefined,
      },
    });
  } catch (error) {
    logger.error("audit.log.failed", {
      entity: entry.entity,
      action: entry.action,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function listAuditLogs(params: {
  page?: number;
  limit?: number;
  entity?: string;
}) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where = params.entity ? { entity: params.entity } : {};

  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, limit };
}
