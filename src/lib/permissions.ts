import type { UserRole } from "./auth";

export const RESOURCES = [
  "subject",
  "class",
  "teacher",
  "student",
  "parent",
  "lesson",
  "exam",
  "assignment",
  "result",
  "attendance",
  "event",
  "announcement",
  "admin",
  "audit",
  "permission",
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = "create" | "read" | "update" | "delete" | "list";

export type Permission = `${Resource}:${Action}`;

export const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  admin: RESOURCES.flatMap((resource) =>
    (["create", "read", "update", "delete", "list"] as Action[]).map(
      (action) => `${resource}:${action}` as Permission
    )
  ),
  teacher: [
    "teacher:read",
    "teacher:update",
    "student:read",
    "student:list",
    "parent:read",
    "parent:list",
    "class:read",
    "class:list",
    "subject:read",
    "subject:list",
    "lesson:read",
    "lesson:list",
    "exam:create",
    "exam:read",
    "exam:update",
    "exam:delete",
    "exam:list",
    "assignment:create",
    "assignment:read",
    "assignment:update",
    "assignment:delete",
    "assignment:list",
    "result:create",
    "result:read",
    "result:update",
    "result:delete",
    "result:list",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "attendance:delete",
    "attendance:list",
    "event:read",
    "event:list",
    "announcement:read",
    "announcement:list",
  ],
  student: [
    "student:read",
    "exam:read",
    "exam:list",
    "assignment:read",
    "assignment:list",
    "result:read",
    "result:list",
    "attendance:read",
    "attendance:list",
    "event:read",
    "event:list",
    "announcement:read",
    "announcement:list",
    "lesson:read",
    "lesson:list",
  ],
  parent: [
    "parent:read",
    "student:read",
    "exam:read",
    "exam:list",
    "assignment:read",
    "assignment:list",
    "result:read",
    "result:list",
    "attendance:read",
    "attendance:list",
    "event:read",
    "event:list",
    "announcement:read",
    "announcement:list",
    "lesson:read",
    "lesson:list",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
}

export function hasEntityPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  return hasPermission(role, `${resource}:${action}`);
}

export function permissionsForRole(role: UserRole): Permission[] {
  return PERMISSION_MATRIX[role] ?? [];
}

export function permissionMatrixRows() {
  return RESOURCES.map((resource) => ({
    resource,
    actions: {
      create: (["admin", "teacher"] as UserRole[]).filter((r) =>
        hasEntityPermission(r, resource, "create")
      ),
      read: (["admin", "teacher", "student", "parent"] as UserRole[]).filter(
        (r) => hasEntityPermission(r, resource, "read")
      ),
      update: (["admin", "teacher"] as UserRole[]).filter((r) =>
        hasEntityPermission(r, resource, "update")
      ),
      delete: (["admin", "teacher"] as UserRole[]).filter((r) =>
        hasEntityPermission(r, resource, "delete")
      ),
      list: (["admin", "teacher", "student", "parent"] as UserRole[]).filter(
        (r) => hasEntityPermission(r, resource, "list")
      ),
    },
  }));
}
