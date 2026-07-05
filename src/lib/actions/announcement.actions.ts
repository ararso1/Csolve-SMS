"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { announcementSchema, AnnouncementSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createAnnouncement = async (
  currentState: ActionState,
  data: AnnouncementSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("announcement", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(announcementSchema, data);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        date: parsed.data.date,
        classId:
          typeof parsed.data.classId === "number" ? parsed.data.classId : null,
      },
    });
    revalidatePath("/list/announcements");
    revalidatePath("/admin");
    revalidatePath("/teacher");
    revalidatePath("/student");
    revalidatePath("/parent");
    return actionSuccess();
  } catch {
    return actionError("Failed to create announcement");
  }
};

export const updateAnnouncement = async (
  currentState: ActionState,
  data: AnnouncementSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("announcement", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(announcementSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Announcement id is required");

  try {
    const { id, ...announcementData } = parsed.data;
    await prisma.announcement.update({
      where: { id },
      data: {
        title: announcementData.title,
        description: announcementData.description,
        date: announcementData.date,
        classId:
          typeof announcementData.classId === "number"
            ? announcementData.classId
            : null,
      },
    });
    revalidatePath("/list/announcements");
    return actionSuccess();
  } catch {
    return actionError("Failed to update announcement");
  }
};

export const deleteAnnouncement = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("announcement", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid announcement id");

  try {
    await prisma.announcement.delete({
      where: { id: parseInt(id as string) },
    });
    revalidatePath("/list/announcements");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete announcement");
  }
};
