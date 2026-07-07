import { Day } from "@prisma/client";
import { z } from "zod";
import { logAudit, type AuditAction } from "../audit";
import type { AuthContext } from "../auth";
import prisma from "../prisma";
import { ActionState } from "./types";

export function actionSuccess(): ActionState {
  return { success: true, error: false };
}

export function actionError(
  message = "Something went wrong",
  fieldErrors?: Record<string, string[]>
): ActionState {
  return { success: false, error: true, message, fieldErrors };
}

export async function recordAudit(
  ctx: AuthContext,
  action: AuditAction,
  entity: string,
  entityId?: string | number | null,
  changes?: Record<string, unknown> | null
) {
  await logAudit({
    userId: ctx.userId,
    userRole: ctx.role,
    action,
    entity,
    entityId,
    changes,
  });
}

export function parseSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; state: ActionState } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join(".") || "form";
      fieldErrors[path] = fieldErrors[path] || [];
      fieldErrors[path].push(err.message);
    });
    return {
      ok: false,
      state: actionError("Validation failed", fieldErrors),
    };
  }
  return { ok: true, data: result.data };
}

export function parseDeleteId(data: FormData): number | string | null {
  const id = data.get("id");
  if (!id || typeof id !== "string") return null;
  return id;
}

export async function teacherOwnsLesson(
  teacherId: string,
  lessonId: number
): Promise<boolean> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, teacherId },
  });
  return !!lesson;
}

export async function findLessonScheduleConflict(params: {
  lessonId?: number;
  teacherId: string;
  classId: number;
  day: Day;
  startTime: Date;
  endTime: Date;
}) {
  const { lessonId, teacherId, classId, day, startTime, endTime } = params;

  return prisma.lesson.findFirst({
    where: {
      day,
      ...(lessonId ? { id: { not: lessonId } } : {}),
      OR: [
        {
          teacherId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        {
          classId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
  });
}

export function toDatetimeLocalValue(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
