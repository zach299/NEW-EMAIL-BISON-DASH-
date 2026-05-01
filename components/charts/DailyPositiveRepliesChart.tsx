"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { DailyMetric } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";
import { format, parseISO } from "date-fns";

interface Props {
  data: DailyMetric[];
  loading?: boolean;
}

export function DailyPositiveRepliesChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const chartData = data.map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Positive Replies</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.every((d) => d.count === 0) ? (
          <EmptyState message="No positive replies for this period." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar
                dataKey="count"
                name="Positive Replies"
                fill={CHART_COLORS.positiveReplies}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
