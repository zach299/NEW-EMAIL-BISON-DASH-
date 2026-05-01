"use client";
import type { PositiveReplyItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ThumbsUp, Building2, Briefcase } from "lucide-react";

interface Props {
  data: PositiveReplyItem[];
  loading?: boolean;
}

function initials(first?: string | null, last?: string | null): string {
  return [(first ?? "?")[0], (last ?? "")[0]].join("").toUpperCase();
}

export function PositiveReplyFeed({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positive Reply Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-emerald-600" />
          <CardTitle>Positive Reply Feed</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="p-5">
            <EmptyState message="No positive replies for this period." />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item) => {
              const fullName = [item.lead_first_name, item.lead_last_name]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {initials(item.lead_first_name, item.lead_last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-gray-900 text-sm">
                        {fullName || item.lead_email}
                      </span>
                      {item.lead_title && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Briefcase className="h-3 w-3" />
                          {item.lead_title}
                        </span>
                      )}
                      {item.lead_company && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" />
                          {item.lead_company}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                      <span className="text-gray-400">Subject:</span>{" "}
                      {item.subject ?? "N/A"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
                      <span>{item.campaign_name ?? "Unknown Campaign"}</span>
                      <span>via {item.sender_email}</span>
                      {item.replied_at && <span>{formatDate(item.replied_at)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
