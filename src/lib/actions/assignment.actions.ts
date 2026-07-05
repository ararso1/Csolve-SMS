"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { assignmentSchema, AssignmentSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
  teacherOwnsLesson,
} from "./helpers";
import { ActionState } from "./types";

export const createAssignment = async (
  currentState: ActionState,
  data: AssignmentSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("assignment", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(assignmentSchema, data);
  if (!parsed.ok) return parsed.state;

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) {
      return actionError("You can only create assignments for your lessons");
    }
  }

  try {
    await prisma.assignment.create({ data: parsed.data });
    revalidatePath("/list/assignments");
    return actionSuccess();
  } catch {
    return actionError("Failed to create assignment");
  }
};

export const updateAssignment = async (
  currentState: ActionState,
  data: AssignmentSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("assignment", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(assignmentSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Assignment id is required");

  if (authResult.ctx.role === "teacher") {
    const ownsLesson = await teacherOwnsLesson(
      authResult.ctx.userId,
      parsed.data.lessonId
    );
    if (!ownsLesson) {
      return actionError("You can only update assignments for your lessons");
    }
  }

  try {
    const { id, ...assignmentData } = parsed.data;
    await prisma.assignment.update({ where: { id }, data: assignmentData });
    revalidatePath("/list/assignments");
    return actionSuccess();
  } catch {
    return actionError("Failed to update assignment");
  }
};

export const deleteAssignment = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("assignment", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid assignment id");

  try {
    if (authResult.ctx.role === "teacher") {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: parseInt(id as string),
          lesson: { teacherId: authResult.ctx.userId },
        },
      });
      if (!assignment) {
        return actionError("You can only delete your own assignments");
      }
    }

    await prisma.assignment.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/assignments");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete assignment");
  }
};
