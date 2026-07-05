import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import QuickActions from "@/components/QuickActions";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const StudentPage = async () => {
  const { userId } = auth();

  const classItem = await prisma.class.findFirst({
    where: {
      students: { some: { id: userId! } },
    },
  });

  return (
    <div className="flex gap-4 flex-col xl:flex-row">
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        <QuickActions role="student" />
        <div className="h-full bg-card border rounded-lg p-4">
          {classItem ? (
            <>
              <h1 className="text-xl font-semibold">
                Schedule ({classItem.name})
              </h1>
              <BigCalendarContainer type="classId" id={classItem.id} />
            </>
          ) : (
            <p className="text-gray-500">No class assigned yet.</p>
          )}
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
