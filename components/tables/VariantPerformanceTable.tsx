"use client";
import type { VariantMetrics } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BOUNCE_BADGE_COLORS, getBounceStatus } from "@/lib/constants";
import { formatPct, formatNumber } from "@/lib/utils";

interface Props {
  data: VariantMetrics[];
  loading?: boolean;
}

export function VariantPerformanceTable({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Subject Line / Variant Performance</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Line / Variant Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="p-5">
            <EmptyState message="No variant data for this period." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Subject",
                    "Step",
                    "Variant",
                    "Sent",
                    "Replies",
                    "Reply Rate",
                    "Pos. Replies",
                    "Pos. Reply Rate",
                    "Bounce Rate",
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
                {data.map((row, i) => {
                  const bounceStatus = getBounceStatus(row.bounce_rate);
                  return (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 max-w-xs truncate text-gray-800 font-medium">
                        {row.subject}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.step_order ?? "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.step_variant ?? "N/A"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatNumber(row.sent)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatNumber(row.replies)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatPct(row.reply_rate)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {formatNumber(row.positive_replies)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {formatPct(row.positive_reply_rate)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={BOUNCE_BADGE_COLORS[bounceStatus]}>
                          {formatPct(row.bounce_rate)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
