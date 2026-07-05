"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SchoolPerformanceChart = ({
  data,
}: {
  data: { month: string; average: number }[];
}) => {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg">School Performance Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[380px]">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center pt-24">
            No result data available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="average"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Avg Score"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SchoolPerformanceChart;
