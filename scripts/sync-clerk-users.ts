/**
 * Dev-only script to sync Prisma seed users to Clerk by username.
 * Usage: npm run sync-clerk
 *
 * Creates missing Clerk accounts with role metadata.
 * Default password: CsolveSmsDev2026xR9k (override via SYNC_DEFAULT_PASSWORD)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const DEFAULT_PASSWORD =
  process.env.SYNC_DEFAULT_PASSWORD || "CsolveSmsDev2026xR9k";

type ClerkErrorBody = {
  errors?: {
    message?: string;
    long_message?: string;
    code?: string;
    meta?: { param_name?: string };
  }[];
};

function parseClerkError(error: string): string {
  try {
    const parsed = JSON.parse(error) as ClerkErrorBody;
    const first = parsed.errors?.[0];
    if (!first) return error;

    if (first.code === "form_password_pwned") {
      return (
        "Clerk rejected the password (found in a known data breach). " +
        "Set a stronger unique password in .env: SYNC_DEFAULT_PASSWORD=YourUniquePass#2026"
      );
    }

    if (first.code === "form_data_missing" || first.code === "form_param_missing") {
      const field = first.meta?.param_name ?? "a required field";
      return (
        `Clerk requires ${field}. Check Dashboard → User & Authentication ` +
        `(enable username and/or email to match this script).`
      );
    }

    return first.long_message || first.message || error;
  } catch {
    return error;
  }
}

async function clerkRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(parseClerkError(await response.text()));
  }

  return response.json();
}

async function findClerkUserByUsername(username: string) {
  const response = await fetch(
    `https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}`,
    {
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    }
  );

  if (!response.ok) return null;
  const users = await response.json();
  return users?.[0] ?? null;
}

function devEmail(username: string, email?: string | null) {
  return email || `${username}@csolve-sms.dev`;
}

async function syncUser(record: {
  username: string;
  role: string;
  email?: string | null;
  name?: string;
  surname?: string;
}) {
  try {
    const existing = await findClerkUserByUsername(record.username);
    if (existing) {
      console.log(`✓ ${record.username} already exists in Clerk (${record.role})`);
      return;
    }

    const body: Record<string, unknown> = {
      username: record.username,
      password: DEFAULT_PASSWORD,
      email_address: [devEmail(record.username, record.email)],
      public_metadata: { role: record.role },
    };

    if (record.name) body.first_name = record.name;
    if (record.surname) body.last_name = record.surname;

    await clerkRequest("/users", body);

    console.log(`+ Created ${record.username} (${record.role})`);
  } catch (error) {
    console.error(
      `✗ Failed to sync ${record.username}:`,
      error instanceof Error ? error.message : error
    );
  }
}

async function main() {
  if (!CLERK_SECRET) {
    throw new Error("CLERK_SECRET_KEY is required");
  }

  const admins = await prisma.admin.findMany();
  const teachers = await prisma.teacher.findMany();
  const students = await prisma.student.findMany();
  const parents = await prisma.parent.findMany();

  for (const admin of admins) {
    await syncUser({
      username: admin.username,
      role: "admin",
      email: devEmail(admin.username),
      name: "Admin",
      surname: admin.username,
    });
  }
  for (const teacher of teachers) {
    await syncUser({
      username: teacher.username,
      role: "teacher",
      email: teacher.email,
      name: teacher.name,
      surname: teacher.surname,
    });
  }
  for (const student of students) {
    await syncUser({
      username: student.username,
      role: "student",
      email: student.email,
      name: student.name,
      surname: student.surname,
    });
  }
  for (const parent of parents) {
    await syncUser({
      username: parent.username,
      role: "parent",
      email: parent.email,
      name: parent.name,
      surname: parent.surname,
    });
  }

  console.log(`\nDone. Login password: ${DEFAULT_PASSWORD}`);
  console.log(
    "Sign in with username (e.g. admin1). Clerk user IDs may differ from Prisma seed IDs."
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
