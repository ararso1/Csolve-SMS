import { logAudit } from "@/lib/audit";
import { parsePagination, requireApiAuth } from "@/lib/api/auth";
import {
  getEntityConfig,
  getPrismaDelegate,
  teacherScopeWhere,
} from "@/lib/api/entities";
import {
  apiCreated,
  apiError,
  apiNotFound,
  apiSuccess,
} from "@/lib/api/response";
import { sanitizeText } from "@/lib/sanitize";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const eventBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  classId: z.number().int().optional().nullable(),
});

const announcementBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.date(),
  classId: z.number().int().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  const config = getEntityConfig(params.entity);
  if (!config) return apiNotFound("Unknown entity");

  const auth = await requireApiAuth(request, config.resource, "list");
  if (!auth.ok) return auth.response;

  const { page, limit, skip } = parsePagination(request.nextUrl.searchParams);
  const delegate = getPrismaDelegate(config);
  const scope = teacherScopeWhere(config, auth.ctx.userId, auth.ctx.role);

  const [data, total] = await prisma.$transaction([
    delegate.findMany({
      where: scope,
      include: config.listInclude,
      take: limit,
      skip,
      orderBy: { id: "desc" },
    }) as Promise<unknown[]>,
    delegate.count({ where: scope }),
  ]);

  return apiSuccess(data, undefined, { page, limit, total });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  const config = getEntityConfig(params.entity);
  if (!config) return apiNotFound("Unknown entity");

  const auth = await requireApiAuth(request, config.resource, "create");
  if (!auth.ok) return auth.response;

  const body = await request.json();

  try {
    if (params.entity === "events") {
      const parsed = eventBodySchema.parse(body);
      const created = await prisma.event.create({
        data: {
          title: sanitizeText(parsed.title),
          description: sanitizeText(parsed.description),
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          classId: parsed.classId ?? null,
        },
      });
      await logAudit({
        userId: auth.ctx.userId,
        userRole: auth.ctx.role,
        action: "CREATE",
        entity: "event",
        entityId: created.id,
        changes: parsed as unknown as Record<string, unknown>,
      });
      return apiCreated(created);
    }

    if (params.entity === "announcements") {
      const parsed = announcementBodySchema.parse(body);
      const created = await prisma.announcement.create({
        data: {
          title: sanitizeText(parsed.title),
          description: sanitizeText(parsed.description),
          date: parsed.date,
          classId: parsed.classId ?? null,
        },
      });
      await logAudit({
        userId: auth.ctx.userId,
        userRole: auth.ctx.role,
        action: "CREATE",
        entity: "announcement",
        entityId: created.id,
        changes: parsed as unknown as Record<string, unknown>,
      });
      return apiCreated(created);
    }

    return apiError(
      "Create via API is only supported for events and announcements. Use the dashboard for other entities.",
      501,
      "NOT_IMPLEMENTED"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 422, "VALIDATION_ERROR", error.flatten());
    }
    return apiError("Failed to create record", 500, "INTERNAL_ERROR");
  }
}
