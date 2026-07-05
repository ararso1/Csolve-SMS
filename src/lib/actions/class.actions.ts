"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { classSchema, ClassSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createClass = async (
  currentState: ActionState,
  data: ClassSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("class", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(classSchema, data);
  if (!parsed.ok) return parsed.state;

  try {
    const { id, ...classData } = parsed.data;
    await prisma.class.create({ data: classData });
    revalidatePath("/list/classes");
    return actionSuccess();
  } catch {
    return actionError("Failed to create class");
  }
};

export const updateClass = async (
  currentState: ActionState,
  data: ClassSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("class", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(classSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Class id is required");

  try {
    const { id, ...classData } = parsed.data;
    await prisma.class.update({ where: { id }, data: classData });
    revalidatePath("/list/classes");
    return actionSuccess();
  } catch {
    return actionError("Failed to update class");
  }
};

export const deleteClass = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("class", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid class id");

  try {
    await prisma.class.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/classes");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete class");
  }
};
