"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import {
  attendanceSchema,
  AttendanceSchema,
  bulkAttendanceSchema,
  BulkAttendanceSchema,
} from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
  teacherOwnsLesson,
} from "./helpers";
import { ActionState } from "./types";

export const createAttendance = async (
  currentState: ActionState,
  data: AttendanceSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("attendance", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(attendanceSchema, data);
  if (!parsed.ok) return parsed.state;

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) {
      return actionError("You can only mark attendance for your lessons");
    }
  }

  try {
    await prisma.attendance.create({
      data: {
        date: parsed.data.date,
        present:
          parsed.data.present === true || parsed.data.present === "true",
        studentId: parsed.data.studentId,
        lessonId: parsed.data.lessonId,
      },
    });
    revalidatePath("/list/attendance");
    return actionSuccess();
  } catch {
    return actionError("Failed to create attendance record");
  }
};

export const updateAttendance = async (
  currentState: ActionState,
  data: AttendanceSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("attendance", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(attendanceSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Attendance id is required");

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) {
      return actionError("You can only update attendance for your lessons");
    }
  }

  try {
    const { id, ...attendanceData } = parsed.data;
    await prisma.attendance.update({
      where: { id },
      data: {
        date: attendanceData.date,
        present:
          attendanceData.present === true ||
          attendanceData.present === "true",
        studentId: attendanceData.studentId,
        lessonId: attendanceData.lessonId,
      },
    });
    revalidatePath("/list/attendance");
    return actionSuccess();
  } catch {
    return actionError("Failed to update attendance record");
  }
};

export const deleteAttendance = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("attendance", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid attendance id");

  try {
    if (authResult.ctx.role === "teacher") {
      const record = await prisma.attendance.findFirst({
        where: {
          id: parseInt(id as string),
          lesson: { teacherId: authResult.ctx.userId },
        },
      });
      if (!record) {
        return actionError("You can only delete attendance for your lessons");
      }
    }

    await prisma.attendance.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/attendance");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete attendance record");
  }
};

export const bulkCreateAttendance = async (
  currentState: ActionState,
  data: BulkAttendanceSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("attendance", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(bulkAttendanceSchema, data);
  if (!parsed.ok) return parsed.state;

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) {
      return actionError("You can only mark attendance for your lessons");
    }
  }

  try {
    for (const record of parsed.data.records) {
      const present =
        record.present === true || record.present === "true";
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: record.studentId,
          lessonId: parsed.data.lessonId,
          date: parsed.data.date,
        },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { present },
        });
      } else {
        await prisma.attendance.create({
          data: {
            date: parsed.data.date,
            present,
            studentId: record.studentId,
            lessonId: parsed.data.lessonId,
          },
        });
      }
    }

    revalidatePath("/list/attendance");
    return actionSuccess();
  } catch {
    return actionError("Failed to save attendance records");
  }
};
