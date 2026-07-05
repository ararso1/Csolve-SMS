import { auth } from "@clerk/nextjs/server";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export type AuthContext = {
  userId: string;
  role: UserRole;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;

  const role = (sessionClaims?.metadata as { role?: UserRole })?.role;
  if (!role) return null;

  return { userId, role };
}

export async function requireAuth(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; message: string }
> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { ok: false, message: "Not authenticated" };
  }
  return { ok: true, ctx };
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; message: string }
> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  if (!allowedRoles.includes(authResult.ctx.role)) {
    return { ok: false, message: "Insufficient permissions" };
  }

  return authResult;
}

const entityPermissions: Record<
  string,
  { create: UserRole[]; update: UserRole[]; delete: UserRole[] }
> = {
  subject: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  class: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  teacher: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  student: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  parent: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  lesson: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  exam: {
    create: ["admin", "teacher"],
    update: ["admin", "teacher"],
    delete: ["admin", "teacher"],
  },
  assignment: {
    create: ["admin", "teacher"],
    update: ["admin", "teacher"],
    delete: ["admin", "teacher"],
  },
  result: {
    create: ["admin", "teacher"],
    update: ["admin", "teacher"],
    delete: ["admin", "teacher"],
  },
  attendance: {
    create: ["admin", "teacher"],
    update: ["admin", "teacher"],
    delete: ["admin", "teacher"],
  },
  event: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  announcement: { create: ["admin"], update: ["admin"], delete: ["admin"] },
  admin: { create: ["admin"], update: ["admin"], delete: ["admin"] },
};

export async function requirePermission(
  entity: keyof typeof entityPermissions,
  action: "create" | "update" | "delete"
) {
  const allowedRoles = entityPermissions[entity][action];
  return requireRole(allowedRoles);
}
