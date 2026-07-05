"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { parentSchema, ParentSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createParent = async (
  currentState: ActionState,
  data: ParentSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("parent", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(parentSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.password) {
    return actionError("Password is required when creating a parent");
  }

  try {
    const user = await clerkClient.users.createUser({
      username: parsed.data.username,
      password: parsed.data.password,
      firstName: parsed.data.name,
      lastName: parsed.data.surname,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
    });

    revalidatePath("/list/parents");
    return actionSuccess();
  } catch {
    return actionError("Failed to create parent");
  }
};

export const updateParent = async (
  currentState: ActionState,
  data: ParentSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("parent", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(parentSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Parent id is required");

  try {
    await clerkClient.users.updateUser(parsed.data.id, {
      username: parsed.data.username,
      ...(parsed.data.password !== "" && { password: parsed.data.password }),
      firstName: parsed.data.name,
      lastName: parsed.data.surname,
    });

    await prisma.parent.update({
      where: { id: parsed.data.id },
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
    });

    revalidatePath("/list/parents");
    return actionSuccess();
  } catch {
    return actionError("Failed to update parent");
  }
};

export const deleteParent = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("parent", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid parent id");

  try {
    const linkedStudents = await prisma.student.count({
      where: { parentId: id as string },
    });
    if (linkedStudents > 0) {
      return actionError("Cannot delete a parent with linked students");
    }

    await clerkClient.users.deleteUser(id as string);
    await prisma.parent.delete({ where: { id: id as string } });
    revalidatePath("/list/parents");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete parent");
  }
};
