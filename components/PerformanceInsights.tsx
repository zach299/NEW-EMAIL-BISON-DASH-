"use client";
import type { InsightCard } from "@/types";
import { TrendingUp, AlertTriangle, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PerformanceInsightsProps {
  insights: InsightCard[];
  loading?: boolean;
}

const icons = {
  positive: TrendingUp,
  warning: AlertTriangle,
  neutral: Minus,
};

const colors = {
  positive: "bg-green-50 border-green-200 text-green-700",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  neutral: "bg-gray-50 border-gray-200 text-gray-600",
};

export function PerformanceInsights({ insights, loading }: PerformanceInsightsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Not enough data to generate insights.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {insights.map((insight, i) => {
        const Icon = icons[insight.type];
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border p-4",
              colors[insight.type]
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {insight.title}
              </span>
            </div>
            <p className="text-2xl font-bold">{insight.value}</p>
            <p className="mt-0.5 text-xs opacity-80">{insight.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
