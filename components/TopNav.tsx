"use client";
import Image from "next/image";
import { BarChart3 } from "lucide-react";
import type { Client } from "@/types";

interface TopNavProps {
  clients: Client[];
  selectedClientId: string;
  onClientChange: (id: string) => void;
}

export function TopNav({ clients, selectedClientId, onClientChange }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-900">
            EmailBison Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="client-select"
            className="text-xs font-medium text-gray-500"
          >
            Client
          </label>
          <select
            id="client-select"
            value={selectedClientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
