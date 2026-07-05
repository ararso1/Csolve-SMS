"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { examSchema, ExamSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
  teacherOwnsLesson,
} from "./helpers";
import { ActionState } from "./types";

export const createExam = async (
  currentState: ActionState,
  data: ExamSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("exam", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(examSchema, data);
  if (!parsed.ok) return parsed.state;

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) return actionError("You can only create exams for your lessons");
  }

  try {
    await prisma.exam.create({
      data: {
        title: parsed.data.title,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        lessonId: parsed.data.lessonId,
      },
    });
    revalidatePath("/list/exams");
    return actionSuccess();
  } catch {
    return actionError("Failed to create exam");
  }
};

export const updateExam = async (
  currentState: ActionState,
  data: ExamSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("exam", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(examSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Exam id is required");

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) return actionError("You can only update exams for your lessons");
  }

  try {
    await prisma.exam.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        lessonId: parsed.data.lessonId,
      },
    });
    revalidatePath("/list/exams");
    return actionSuccess();
  } catch {
    return actionError("Failed to update exam");
  }
};

export const deleteExam = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("exam", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid exam id");

  try {
    if (authResult.ctx.role === "teacher") {
      const exam = await prisma.exam.findFirst({
        where: {
          id: parseInt(id as string),
          lesson: { teacherId: authResult.ctx.userId },
        },
      });
      if (!exam) return actionError("You can only delete your own exams");
    }

    await prisma.exam.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/exams");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete exam");
  }
};
