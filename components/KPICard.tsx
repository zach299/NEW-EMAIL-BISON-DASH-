"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  statusClass?: string;
  loading?: boolean;
}

export function KPICard({
  label,
  value,
  subtext,
  statusClass,
  loading,
}: KPICardProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={cn(
          "text-3xl font-bold text-gray-900",
          statusClass
        )}
      >
        {value}
      </p>
      {subtext && (
        <p className="mt-1 text-xs text-gray-500 truncate">{subtext}</p>
      )}
    </Card>
  );
}
