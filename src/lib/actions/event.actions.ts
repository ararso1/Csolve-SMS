"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth";
import { eventSchema, EventSchema } from "../formValidationSchemas";
import prisma from "../prisma";
import {
  actionError,
  actionSuccess,
  parseDeleteId,
  parseSchema,
} from "./helpers";
import { ActionState } from "./types";

export const createEvent = async (
  currentState: ActionState,
  data: EventSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("event", "create");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(eventSchema, data);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        classId:
          typeof parsed.data.classId === "number" ? parsed.data.classId : null,
      },
    });
    revalidatePath("/list/events");
    revalidatePath("/admin");
    return actionSuccess();
  } catch {
    return actionError("Failed to create event");
  }
};

export const updateEvent = async (
  currentState: ActionState,
  data: EventSchema
): Promise<ActionState> => {
  const authResult = await requirePermission("event", "update");
  if (!authResult.ok) return actionError(authResult.message);

  const parsed = parseSchema(eventSchema, data);
  if (!parsed.ok) return parsed.state;
  if (!parsed.data.id) return actionError("Event id is required");

  try {
    const { id, ...eventData } = parsed.data;
    await prisma.event.update({
      where: { id },
      data: {
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        classId:
          typeof eventData.classId === "number" ? eventData.classId : null,
      },
    });
    revalidatePath("/list/events");
    revalidatePath("/admin");
    return actionSuccess();
  } catch {
    return actionError("Failed to update event");
  }
};

export const deleteEvent = async (
  currentState: ActionState,
  data: FormData
): Promise<ActionState> => {
  const authResult = await requirePermission("event", "delete");
  if (!authResult.ok) return actionError(authResult.message);

  const id = parseDeleteId(data);
  if (!id) return actionError("Invalid event id");

  try {
    await prisma.event.delete({ where: { id: parseInt(id as string) } });
    revalidatePath("/list/events");
    revalidatePath("/admin");
    return actionSuccess();
  } catch {
    return actionError("Failed to delete event");
  }
};
