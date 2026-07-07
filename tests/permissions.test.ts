import { describe, expect, it } from "vitest";
import {
  hasEntityPermission,
  hasPermission,
  permissionsForRole,
} from "../src/lib/permissions";

describe("permissions", () => {
  it("grants admin full access to students", () => {
    expect(hasEntityPermission("admin", "student", "create")).toBe(true);
    expect(hasEntityPermission("admin", "student", "delete")).toBe(true);
  });

  it("allows teachers to manage exams but not students create", () => {
    expect(hasEntityPermission("teacher", "exam", "create")).toBe(true);
    expect(hasEntityPermission("teacher", "student", "create")).toBe(false);
    expect(hasEntityPermission("teacher", "student", "read")).toBe(true);
  });

  it("restricts students to read-only on results", () => {
    expect(hasEntityPermission("student", "result", "read")).toBe(true);
    expect(hasEntityPermission("student", "result", "create")).toBe(false);
  });

  it("returns permission list per role", () => {
    expect(permissionsForRole("parent").length).toBeGreaterThan(0);
    expect(hasPermission("parent", "announcement:read")).toBe(true);
  });
});
