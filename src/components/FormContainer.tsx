import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject": {
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      }
      case "class": {
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      }
      case "teacher": {
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      }
      case "student": {
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        const parents = await prisma.parent.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = {
          classes: studentClasses,
          grades: studentGrades,
          parents,
        };
        break;
      }
      case "lesson": {
        const subjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const classes = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        const teachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { subjects, classes, teachers };
        break;
      }
      case "exam":
      case "assignment":
      case "attendance": {
        const lessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true, classId: true },
        });
        relatedData = { lessons };
        break;
      }
      case "result": {
        const students = await prisma.student.findMany({
          select: { id: true, name: true, surname: true },
        });
        const exams = await prisma.exam.findMany({
          where: {
            ...(role === "teacher"
              ? { lesson: { teacherId: currentUserId! } }
              : {}),
          },
          select: { id: true, title: true },
        });
        const assignments = await prisma.assignment.findMany({
          where: {
            ...(role === "teacher"
              ? { lesson: { teacherId: currentUserId! } }
              : {}),
          },
          select: { id: true, title: true },
        });
        relatedData = { students, exams, assignments };
        break;
      }
      case "event":
      case "announcement": {
        const classes = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        relatedData = { classes };
        break;
      }
      default:
        break;
    }
  }

  if (table === "attendance" && type !== "delete") {
    const students = await prisma.student.findMany({
      select: { id: true, name: true, surname: true, classId: true },
    });
    relatedData = { ...(relatedData as object), students };
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
