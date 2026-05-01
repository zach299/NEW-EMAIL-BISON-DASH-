"use client";
import { InboxIcon } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
      <InboxIcon className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
