"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { lessonSchema, LessonSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  findLessonScheduleConflict,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createLesson = async (
  currentState: ActionState,
  data: LessonSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("lesson", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(lessonSchema, data);
  if (!parsed.ok) return parsed.state;

  const conflict = await findLessonScheduleConflict({
    teacherId: parsed.data.teacherId,
    classId: parsed.data.classId,
    day: parsed.data.day,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
  });
  if (conflict) {
    return actionError("Schedule conflict with an existing lesson");
  }

  try {
    await prisma.lesson.create({ data: parsed.data });
    revalidatePath("/list/lessons");
    return actionSuccess();
  } catch {
    return actionError("Failed to create lesson");
  }
};

export const updateLesson = async (
  currentState: ActionState,
  data: LessonSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("lesson", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(lessonSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Lesson id is required");

  const conflict = await findLessonScheduleConflict({
    lessonId: parsed.data.id,
    teacherId: parsed.data.teacherId,
    classId: parsed.data.classId,
    day: parsed.data.day,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
  });
  if (conflict) {
    return actionError("Schedule conflict with an existing lesson");
  }

  try {
    const { id, ...lessonData } = parsed.data;
    await prisma.lesson.update({ where: { id }, data: lessonData });
    revalidatePath("/list/lessons");
    return actionSuccess();
  } catch {
    return actionError("Failed to update lesson");
  }
};

export const deleteLesson = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("lesson", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid lesson id");

  try {
    await prisma.lesson.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/lessons");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete lesson");
  }
};
