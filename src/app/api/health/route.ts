import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const status = database === "ok" ? "ok" : "degraded";
  const code = database === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: "csolve-sms",
      checks: { database },
    },
    { status: code }
  );
}
