"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { subjectSchema, SubjectSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
  recordAudit,
} from "./helpers";
import { ActionState } from "./types";

export const createSubject = async (
  currentState: ActionState,
  data: SubjectSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("subject", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(subjectSchema, data);
  if (!parsed.ok) return parsed.state;

  try {
    const created = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        teachers: {
          connect: parsed.data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
    await recordAudit(authResult.ctx, "CREATE", "subject", created.id, parsed.data);
    revalidatePath("/list/subjects");
    return actionSuccess();
  } catch {
    return actionError("Failed to create subject");
  }
};

export const updateSubject = async (
  currentState: ActionState,
  data: SubjectSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("subject", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(subjectSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Subject id is required");

  try {
    await prisma.subject.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        teachers: {
          set: parsed.data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
    await recordAudit(authResult.ctx, "UPDATE", "subject", parsed.data.id, parsed.data);
    revalidatePath("/list/subjects");
    return actionSuccess();
  } catch {
    return actionError("Failed to update subject");
  }
};

export const deleteSubject = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("subject", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid subject id");

  try {
    await prisma.subject.delete({ where: { id: parseInt(id as string) } });
    await recordAudit(authResult.ctx, "DELETE", "subject", id);
    revalidatePath("/list/subjects");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete subject");
  }
};
