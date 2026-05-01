"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { FunnelStep } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const FUNNEL_COLORS = ["#6366f1", "#3b82f6", "#10b981"];

interface Props {
  data: FunnelStep[];
  loading?: boolean;
}

export function ReplyFunnelChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const hasData = data.some((d) => d.value > 0);

  const chartData = data.map((step) => ({
    name: step.name,
    value: step.value,
    conversion: step.conversionRate === 1
      ? "100%"
      : `${(step.conversionRate * 100).toFixed(1)}%`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reply Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState message="No funnel data for this period." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 60, left: 60, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value: number, _name: string, props) => [
                  `${value.toLocaleString()} (${props.payload.conversion})`,
                  props.payload.name,
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={FUNNEL_COLORS[i]} />
                ))}
                <LabelList
                  dataKey="conversion"
                  position="right"
                  style={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
