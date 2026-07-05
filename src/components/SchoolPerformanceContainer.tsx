import SchoolPerformanceChart from "./SchoolPerformanceChart";
import prisma from "@/lib/prisma";

const SchoolPerformanceContainer = async () => {
  const results = await prisma.result.findMany({
    select: { score: true, exam: { select: { startTime: true } }, assignment: { select: { startDate: true } } },
  });

  const monthlyMap = new Map<string, { total: number; count: number }>();

  results.forEach((result) => {
    const date = result.exam?.startTime || result.assignment?.startDate;
    if (!date) return;
    const key = date.toLocaleString("en-US", { month: "short" });
    const current = monthlyMap.get(key) || { total: 0, count: 0 };
    current.total += result.score;
    current.count += 1;
    monthlyMap.set(key, current);
  });

  const data = Array.from(monthlyMap.entries()).map(([month, stats]) => ({
    month,
    average: Math.round(stats.total / stats.count),
  }));

  return <SchoolPerformanceChart data={data} />;
};

export default SchoolPerformanceContainer;
