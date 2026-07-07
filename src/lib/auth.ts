import { auth, currentUser } from "@clerk/nextjs/server";
import {
  type Action,
  hasEntityPermission,
  type Permission,
  type Resource,
} from "./permissions";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export type AuthContext = {
  userId: string;
  role: UserRole;
};

async function resolveRole(
  sessionClaims: ReturnType<typeof auth>["sessionClaims"]
): Promise<UserRole | null> {
  const jwtRole = (sessionClaims?.metadata as { role?: UserRole })?.role;
  if (jwtRole) return jwtRole;

  const user = await currentUser();
  const metadataRole = user?.publicMetadata?.role as UserRole | undefined;
  return metadataRole ?? null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;

  const role = await resolveRole(sessionClaims);
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

export async function requirePermission(
  resource: Resource,
  action: Action
): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; message: string }
> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  if (!hasEntityPermission(authResult.ctx.role, resource, action)) {
    return {
      ok: false,
      message: `Permission denied: ${resource}:${action}`,
    };
  }

  return authResult;
}

export function checkPermission(role: UserRole, permission: Permission): boolean {
  const [resource, action] = permission.split(":") as [Resource, Action];
  return hasEntityPermission(role, resource, action);
}
