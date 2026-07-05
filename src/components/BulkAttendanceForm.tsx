"use client";

import { bulkCreateAttendance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type LessonOption = {
  id: number;
  name: string;
  classId: number;
};

type StudentOption = {
  id: string;
  name: string;
  surname: string;
  classId: number;
};

const BulkAttendanceForm = ({
  lessons,
  students,
}: {
  lessons: LessonOption[];
  students: StudentOption[];
}) => {
  const [lessonId, setLessonId] = useState<number>(lessons[0]?.id ?? 0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  const [state, formAction] = useFormState(bulkCreateAttendance, {
    success: false,
    error: false,
  });

  const router = useRouter();

  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);
  const classStudents = useMemo(
    () =>
      students.filter(
        (student) => student.classId === selectedLesson?.classId
      ),
    [students, selectedLesson?.classId]
  );

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    classStudents.forEach((student) => {
      initial[student.id] = true;
    });
    setAttendanceMap(initial);
  }, [classStudents]);

  useEffect(() => {
    if (state.success) {
      toast("Attendance saved for all students!");
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    formAction({
      lessonId,
      date: new Date(date),
      records: classStudents.map((student) => ({
        studentId: student.id,
        present: attendanceMap[student.id] ?? true,
      })),
    });
  };

  if (!lessons.length) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-md mb-4 border border-gray-100">
      <h2 className="text-md font-semibold mb-4">Bulk Attendance</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Lesson</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
              value={lessonId}
              onChange={(e) => setLessonId(parseInt(e.target.value))}
            >
              {lessons.map((lesson) => (
                <option value={lesson.id} key={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Date</label>
            <input
              type="date"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {classStudents.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-2 text-sm border p-2 rounded-md"
            >
              <input
                type="checkbox"
                checked={attendanceMap[student.id] ?? true}
                onChange={(e) =>
                  setAttendanceMap((prev) => ({
                    ...prev,
                    [student.id]: e.target.checked,
                  }))
                }
              />
              {student.name} {student.surname}
            </label>
          ))}
        </div>
        {state.error && (
          <span className="text-red-500">
            {state.message || "Failed to save attendance"}
          </span>
        )}
        <button
          type="submit"
          className="bg-blue-400 text-white p-2 rounded-md w-max"
        >
          Save Attendance
        </button>
      </form>
    </div>
  );
};

export default BulkAttendanceForm;
