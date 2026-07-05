"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { teacherSchema, TeacherSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createTeacher = async (
  currentState: ActionState,
  data: TeacherSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("teacher", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(teacherSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.password) {
    return actionError("Password is required when creating a teacher");
  }

  try {
    const user = await clerkClient.users.createUser({
      username: parsed.data.username,
      password: parsed.data.password,
      firstName: parsed.data.name,
      lastName: parsed.data.surname,
      publicMetadata: { role: "teacher" },
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address,
        img: parsed.data.img || null,
        bloodType: parsed.data.bloodType,
        sex: parsed.data.sex,
        birthday: parsed.data.birthday,
        subjects: {
          connect: parsed.data.subjects?.map((subjectId) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return actionSuccess();
  } catch {
    return actionError("Failed to create teacher");
  }
};

export const updateTeacher = async (
  currentState: ActionState,
  data: TeacherSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("teacher", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(teacherSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Teacher id is required");

  try {
    await clerkClient.users.updateUser(parsed.data.id, {
      username: parsed.data.username,
      ...(parsed.data.password !== "" && { password: parsed.data.password }),
      firstName: parsed.data.name,
      lastName: parsed.data.surname,
    });

    await prisma.teacher.update({
      where: { id: parsed.data.id },
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address,
        img: parsed.data.img || null,
        bloodType: parsed.data.bloodType,
        sex: parsed.data.sex,
        birthday: parsed.data.birthday,
        subjects: {
          set: parsed.data.subjects?.map((subjectId) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return actionSuccess();
  } catch {
    return actionError("Failed to update teacher");
  }
};

export const deleteTeacher = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("teacher", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid teacher id");

  try {
    await clerkClient.users.deleteUser(id as string);
    await prisma.teacher.delete({ where: { id: id as string } });
    revalidatePath("/list/teachers");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete teacher");
  }
};
