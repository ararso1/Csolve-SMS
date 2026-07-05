"use client";

import {
  deleteAnnouncement,
  deleteAssignment,
  deleteClass,
  deleteEvent,
  deleteExam,
  deleteLesson,
  deleteParent,
  deleteResult,
  deleteAttendance,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { FormContainerProps } from "./FormContainer";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  parent: deleteParent,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  result: deleteResult,
  attendance: deleteAttendance,
  event: deleteEvent,
  announcement: deleteAnnouncement,
};

const TeacherForm = dynamic(() => import("./forms/TeacherForm"));
const StudentForm = dynamic(() => import("./forms/StudentForm"));
const SubjectForm = dynamic(() => import("./forms/SubjectForm"));
const ClassForm = dynamic(() => import("./forms/ClassForm"));
const ExamForm = dynamic(() => import("./forms/ExamForm"));
const ParentForm = dynamic(() => import("./forms/ParentForm"));
const LessonForm = dynamic(() => import("./forms/LessonForm"));
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"));
const ResultForm = dynamic(() => import("./forms/ResultForm"));
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"));
const EventForm = dynamic(() => import("./forms/EventForm"));
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"));

const forms: Record<
  string,
  (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element
> = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  result: (setOpen, type, data, relatedData) => (
    <ResultForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const triggerIcon =
    type === "create" ? (
      <Plus className="h-4 w-4" />
    ) : type === "update" ? (
      <Pencil className="h-4 w-4" />
    ) : (
      <Trash2 className="h-4 w-4" />
    );

  const triggerVariant =
    type === "create" ? "default" : type === "update" ? "secondary" : "destructive";

  const DeleteForm = () => {
    const [state, formAction] = useFormState(deleteActionMap[table], {
      success: false,
      error: false,
    });

    useEffect(() => {
      if (state.success) {
        toast.success(`${table} deleted successfully`);
        setOpen(false);
        router.refresh();
      } else if (state.error) {
        toast.error(state.message || "Delete failed");
      }
    }, [state]);

    return (
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <p className="text-sm text-muted-foreground">
          All data will be lost. Are you sure you want to delete this {table}?
        </p>
        <Button type="submit" variant="destructive" className="self-end">
          Confirm Delete
        </Button>
      </form>
    );
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => setOpen(true)}
        aria-label={`${type} ${table}`}
      >
        {triggerIcon}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {type} {table}
            </DialogTitle>
            {type === "delete" && (
              <DialogDescription>This action cannot be undone.</DialogDescription>
            )}
          </DialogHeader>
          {type === "delete" && id ? (
            <DeleteForm />
          ) : type === "create" || type === "update" ? (
            forms[table]?.(setOpen, type, data, relatedData) ?? (
              <p>Form not found</p>
            )
          ) : (
            <p>Form not found</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormModal;
