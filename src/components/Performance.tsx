"use client";

import { PieChart, Pie, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Performance = ({
  averageScore,
  totalResults,
}: {
  averageScore: number | null;
  totalResults: number;
}) => {
  const score = averageScore ?? 0;
  const display = averageScore !== null ? score.toFixed(1) : "—";
  const percentage = Math.min(score, 100);

  const data = [
    { name: "Score", value: percentage, fill: "hsl(var(--primary))" },
    { name: "Remaining", value: Math.max(100 - percentage, 0), fill: "hsl(var(--muted))" },
  ];

  return (
    <Card className="h-80 relative">
      <CardHeader>
        <CardTitle className="text-xl">Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        {totalResults === 0 ? (
          <p className="text-sm text-muted-foreground text-center pt-16">
            No results recorded yet.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
              <p className="text-3xl font-bold">{display}</p>
              <p className="text-xs text-muted-foreground">avg score / 100</p>
            </div>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Based on {totalResults} result{totalResults !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Performance;
