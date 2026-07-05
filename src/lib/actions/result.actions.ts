"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { resultSchema, ResultSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
  teacherOwnsLesson,
} from "./helpers";
import { ActionState } from "./types";

async function teacherCanManageResult(
  teacherId: string,
  examId?: number | null,
  assignmentId?: number | null
) {
  if (examId) {
    const exam = await prisma.exam.findFirst({
      where: { id: examId, lesson: { teacherId } },
    });
    return !!exam;
  }

  if (assignmentId) {
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, lesson: { teacherId } },
    });
    return !!assignment;
  }

  return false;
}

export const createResult = async (
  currentState: ActionState,
  data: ResultSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("result", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(resultSchema, data);
  if (!parsed.ok) return parsed.state;

  if (authResult.ctx.role === "teacher") {
    const allowed = await teacherCanManageResult(
      authResult.ctx.userId,
      parsed.data.examId,
      parsed.data.assignmentId
    );
    if (!allowed) {
      return actionError("You can only add results for your lessons");
    }
  }

  try {
    await prisma.result.create({
      data: {
        score: parsed.data.score,
        studentId: parsed.data.studentId,
        examId: parsed.data.examId || null,
        assignmentId: parsed.data.assignmentId || null,
      },
    });
    revalidatePath("/list/results");
    return actionSuccess();
  } catch {
    return actionError("Failed to create result");
  }
};

export const updateResult = async (
  currentState: ActionState,
  data: ResultSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("result", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(resultSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Result id is required");

  if (authResult.ctx.role === "teacher") {
    const allowed = await teacherCanManageResult(
      authResult.ctx.userId,
      parsed.data.examId,
      parsed.data.assignmentId
    );
    if (!allowed) {
      return actionError("You can only update results for your lessons");
    }
  }

  try {
    const { id, ...resultData } = parsed.data;
    await prisma.result.update({
      where: { id },
      data: {
        score: resultData.score,
        studentId: resultData.studentId,
        examId: resultData.examId || null,
        assignmentId: resultData.assignmentId || null,
      },
    });
    revalidatePath("/list/results");
    return actionSuccess();
  } catch {
    return actionError("Failed to update result");
  }
};

export const deleteResult = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("result", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid result id");

  try {
    if (authResult.ctx.role === "teacher") {
      const result = await prisma.result.findFirst({
        where: {
          id: parseInt(id as string),
          OR: [
            { exam: { lesson: { teacherId: authResult.ctx.userId } } },
            { assignment: { lesson: { teacherId: authResult.ctx.userId } } },
          ],
        },
      });
      if (!result) {
        return actionError("You can only delete results for your lessons");
      }
    }

    await prisma.result.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/results");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete result");
  }
};
