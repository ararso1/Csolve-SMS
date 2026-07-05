import BulkAttendanceForm from "@/components/BulkAttendanceForm";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Attendance, Class, Lesson, Prisma, Student } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

type AttendanceList = Attendance & {
  student: Student;
  lesson: Lesson & { class: Class };
};

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const canManage = role === "admin" || role === "teacher";

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Lesson", accessor: "lesson" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden lg:table-cell",
    },
    ...(canManage
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: AttendanceList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        {item.student.name} {item.student.surname}
      </td>
      <td>{item.lesson.name}</td>
      <td className="hidden md:table-cell">{item.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.date)}
      </td>
      <td className="hidden lg:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.present
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.present ? "Present" : "Absent"}
        </span>
      </td>
      {canManage && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="attendance" type="update" data={item} />
            <FormContainer table="attendance" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, classId, from, to, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AttendanceWhereInput = {};

  if (classId) {
    query.lesson = { classId: parseInt(classId) };
  }

  if (from || to) {
    query.date = {};
    if (from) query.date.gte = new Date(from);
    if (to) query.date.lte = new Date(to);
  }

  if (queryParams.search) {
    query.student = {
      OR: [
        { name: { contains: queryParams.search, mode: "insensitive" } },
        { surname: { contains: queryParams.search, mode: "insensitive" } },
      ],
    };
  }

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson = {
        ...(query.lesson as object),
        teacherId: currentUserId!,
      };
      break;
    case "student":
      query.studentId = currentUserId!;
      break;
    case "parent":
      query.student = { parentId: currentUserId! };
      break;
    default:
      break;
  }

  const [data, count, lessons, students, classes] = await Promise.all([
    prisma.attendance.findMany({
      where: query,
      include: {
        student: true,
        lesson: { include: { class: true } },
      },
      orderBy: { date: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.attendance.count({ where: query }),
    canManage
      ? prisma.lesson.findMany({
          where: role === "teacher" ? { teacherId: currentUserId! } : {},
          select: { id: true, name: true, classId: true },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.student.findMany({
          select: { id: true, name: true, surname: true, classId: true },
        })
      : Promise.resolve([]),
    role === "admin"
      ? prisma.class.findMany({ select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  const exportParams = new URLSearchParams();
  if (classId) exportParams.set("classId", classId);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {canManage && (
        <BulkAttendanceForm lessons={lessons} students={students} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end flex-wrap">
            {role === "admin" && (
              <>
                <Link
                  href={`/api/attendance/export?${exportParams.toString()}`}
                  className="text-sm bg-lamaSky text-white px-3 py-2 rounded-md"
                >
                  Export CSV
                </Link>
                {classes.map((classItem) => (
                  <Link
                    key={classItem.id}
                    href={`?classId=${classItem.id}`}
                    className="text-xs px-2 py-1 bg-gray-100 rounded-md"
                  >
                    {classItem.name}
                  </Link>
                ))}
              </>
            )}
            {canManage && (
              <FormContainer table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AttendanceListPage;
