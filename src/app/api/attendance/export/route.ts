import { getAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: {
    lesson?: { classId: number };
    date?: { gte?: Date; lte?: Date };
  } = {};

  if (classId) {
    where.lesson = { classId: parseInt(classId) };
  }

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      student: true,
      lesson: { include: { class: true } },
    },
    orderBy: { date: "desc" },
  });

  const header = "Student,Class,Lesson,Date,Status\n";
  const rows = records
    .map((record) => {
      const student = `"${record.student.name} ${record.student.surname}"`;
      const className = `"${record.lesson.class.name}"`;
      const lesson = `"${record.lesson.name}"`;
      const date = record.date.toISOString().split("T")[0];
      const status = record.present ? "Present" : "Absent";
      return `${student},${className},${lesson},${date},${status}`;
    })
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="attendance.csv"',
    },
  });
}
