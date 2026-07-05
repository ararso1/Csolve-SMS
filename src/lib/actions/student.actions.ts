"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { studentSchema, StudentSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createStudent = async (
  currentState: ActionState,
  data: StudentSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("student", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(studentSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.password) {
    return actionError("Password is required when creating a student");
  }

  try {
    const classItem = await prisma.class.findUnique({
      where: { id: parsed.data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return actionError("Class is at full capacity");
    }

    const user = await clerkClient.users.createUser({
      username: parsed.data.username,
      password: parsed.data.password,
      firstName: parsed.data.name,
      lastName: parsed.data.surname,
      publicMetadata: { role: "student" },
    });

    await prisma.student.create({
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
        gradeId: parsed.data.gradeId,
        classId: parsed.data.classId,
        parentId: parsed.data.parentId,
      },
    });

    revalidatePath("/list/students");
    return actionSuccess();
  } catch {
    return actionError("Failed to create student");
  }
};

export const updateStudent = async (
  currentState: ActionState,
  data: StudentSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("student", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(studentSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Student id is required");

  try {
    await clerkClient.users.updateUser(parsed.data.id, {
      username: parsed.data.username,
      ...(parsed.data.password !== "" && { password: parsed.data.password }),
      firstName: parsed.data.name,
      lastName: parsed.data.surname,
    });

    await prisma.student.update({
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
        gradeId: parsed.data.gradeId,
        classId: parsed.data.classId,
        parentId: parsed.data.parentId,
      },
    });

    revalidatePath("/list/students");
    return actionSuccess();
  } catch {
    return actionError("Failed to update student");
  }
};

export const deleteStudent = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("student", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid student id");

  try {
    await clerkClient.users.deleteUser(id as string);
    await prisma.student.delete({ where: { id: id as string } });
    revalidatePath("/list/students");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete student");
  }
};
