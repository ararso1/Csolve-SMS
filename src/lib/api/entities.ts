import type { Resource } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export type EntityConfig = {
  resource: Resource;
  prismaKey: keyof typeof prisma;
  idType: "int" | "string";
  listInclude?: object;
  teacherScoped?: boolean;
  teacherScopeField?: string;
};

export const API_ENTITIES: Record<string, EntityConfig> = {
  students: {
    resource: "student",
    prismaKey: "student",
    idType: "string",
    listInclude: { class: true, grade: true },
  },
  teachers: {
    resource: "teacher",
    prismaKey: "teacher",
    idType: "string",
    listInclude: { subjects: true, classes: true },
  },
  parents: {
    resource: "parent",
    prismaKey: "parent",
    idType: "string",
    listInclude: { students: true },
  },
  subjects: {
    resource: "subject",
    prismaKey: "subject",
    idType: "int",
    listInclude: { teachers: true },
  },
  classes: {
    resource: "class",
    prismaKey: "class",
    idType: "int",
    listInclude: { grade: true, supervisor: true },
  },
  lessons: {
    resource: "lesson",
    prismaKey: "lesson",
    idType: "int",
    listInclude: { subject: true, class: true, teacher: true },
    teacherScoped: true,
    teacherScopeField: "teacherId",
  },
  exams: {
    resource: "exam",
    prismaKey: "exam",
    idType: "int",
    listInclude: { lesson: true },
    teacherScoped: true,
    teacherScopeField: "lesson.teacherId",
  },
  assignments: {
    resource: "assignment",
    prismaKey: "assignment",
    idType: "int",
    listInclude: { lesson: true },
    teacherScoped: true,
    teacherScopeField: "lesson.teacherId",
  },
  results: {
    resource: "result",
    prismaKey: "result",
    idType: "int",
    listInclude: { student: true, exam: true, assignment: true },
  },
  attendance: {
    resource: "attendance",
    prismaKey: "attendance",
    idType: "int",
    listInclude: { student: true, lesson: true },
    teacherScoped: true,
    teacherScopeField: "lesson.teacherId",
  },
  events: {
    resource: "event",
    prismaKey: "event",
    idType: "int",
    listInclude: { class: true },
  },
  announcements: {
    resource: "announcement",
    prismaKey: "announcement",
    idType: "int",
    listInclude: { class: true },
  },
  admins: {
    resource: "admin",
    prismaKey: "admin",
    idType: "string",
  },
};

export function getEntityConfig(entity: string): EntityConfig | null {
  return API_ENTITIES[entity] ?? null;
}

export function getPrismaDelegate(config: EntityConfig) {
  return prisma[config.prismaKey] as {
    findMany: (args?: object) => Promise<unknown[]>;
    findUnique: (args: object) => Promise<unknown | null>;
    count: (args?: object) => Promise<number>;
    delete: (args: object) => Promise<unknown>;
  };
}

export function teacherScopeWhere(
  config: EntityConfig,
  userId: string,
  role: string
) {
  if (role !== "teacher" || !config.teacherScoped) return {};

  if (config.teacherScopeField === "teacherId") {
    return { teacherId: userId };
  }

  if (config.teacherScopeField === "lesson.teacherId") {
    return { lesson: { teacherId: userId } };
  }

  return {};
}

export function parseEntityId(config: EntityConfig, raw: string) {
  if (config.idType === "int") {
    const id = parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
  }
  return raw;
}
