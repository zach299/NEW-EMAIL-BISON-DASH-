"use client";
import type { SenderMetrics } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BOUNCE_BADGE_COLORS, BOUNCE_STATUS_COLORS } from "@/lib/constants";
import { formatPct, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  data: SenderMetrics[];
  loading?: boolean;
}

const statusLabel = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
};

export function SenderHealthTable({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Sender Inbox Health</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sender Inbox Health</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="p-5">
            <EmptyState message="No sender data for this period." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Sender Inbox",
                    "Sent",
                    "Replies",
                    "Pos. Replies",
                    "Bounces",
                    "Bounce Rate",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.sender_email}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.sender_email}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatNumber(row.sent)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNumber(row.replies)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatNumber(row.positive_replies)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatNumber(row.bounces)}</td>
                    <td className="px-4 py-3">
                      <Badge className={BOUNCE_BADGE_COLORS[row.status]}>
                        {formatPct(row.bounce_rate)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          BOUNCE_STATUS_COLORS[row.status]
                        )}
                      >
                        {statusLabel[row.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
