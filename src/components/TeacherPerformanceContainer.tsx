import Performance from "./Performance";
import prisma from "@/lib/prisma";

const TeacherPerformanceContainer = async ({ teacherId }: { teacherId: string }) => {
  const results = await prisma.result.findMany({
    where: {
      OR: [
        { exam: { lesson: { teacherId } } },
        { assignment: { lesson: { teacherId } } },
      ],
    },
    select: { score: true },
  });

  const averageScore =
    results.length > 0
      ? results.reduce((sum, item) => sum + item.score, 0) / results.length
      : null;

  return (
    <Performance averageScore={averageScore} totalResults={results.length} />
  );
};

export default TeacherPerformanceContainer;
