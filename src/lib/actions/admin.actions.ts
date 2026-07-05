"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { adminSchema, AdminSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createAdmin = async (
  currentState: ActionState,
  data: AdminSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("admin", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(adminSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.password) {
    return actionError("Password is required when creating an admin");
  }

  try {
    const user = await clerkClient.users.createUser({
      username: parsed.data.username,
      password: parsed.data.password,
      publicMetadata: { role: "admin" },
    });

    await prisma.admin.create({
      data: {
        id: user.id,
        username: parsed.data.username,
      },
    });

    revalidatePath("/admin");
    return actionSuccess();
  } catch {
    return actionError("Failed to create admin");
  }
};

export const deleteAdmin = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("admin", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid admin id");

  if (id === authResult.ctx.userId) {
    return actionError("You cannot delete your own admin account");
  }

  try {
    await clerkClient.users.deleteUser(id as string);
    await prisma.admin.delete({ where: { id: id as string } });
    revalidatePath("/admin");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete admin");
  }
};
