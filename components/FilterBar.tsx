"use client";
import type { Campaign } from "@/types";
import type { DashboardFilters } from "@/types";

interface FilterBarProps {
  campaigns: Campaign[];
  senderEmails: string[];
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

export function FilterBar({
  campaigns,
  senderEmails,
  filters,
  onChange,
}: FilterBarProps) {
  function set(patch: Partial<DashboardFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">From</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => set({ dateFrom: e.target.value })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">To</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => set({ dateTo: e.target.value })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Campaign</label>
        <select
          multiple
          value={filters.campaignIds}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            set({ campaignIds: selected });
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          style={{ height: "auto", minHeight: "36px" }}
          size={Math.min(campaigns.length, 3)}
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {filters.campaignIds.length > 0 && (
          <button
            onClick={() => set({ campaignIds: [] })}
            className="text-xs text-indigo-600 hover:underline text-left"
          >
            Clear ({filters.campaignIds.length})
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Sender</label>
        <select
          multiple
          value={filters.senderEmails}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            set({ senderEmails: selected });
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          size={Math.min(senderEmails.length, 3)}
        >
          {senderEmails.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
        {filters.senderEmails.length > 0 && (
          <button
            onClick={() => set({ senderEmails: [] })}
            className="text-xs text-indigo-600 hover:underline text-left"
          >
            Clear ({filters.senderEmails.length})
          </button>
        )}
      </div>
    </div>
  );
}
