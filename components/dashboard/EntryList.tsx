"use client";

import { useState } from "react";
import type { Entry } from "@/types/entry";
import { metricConfigs } from "@/lib/metrics";
import { formatMacroValue, hasMacroData } from "@/lib/nutrition";
import { formatDisplayDate } from "@/utils/date";

type EntryListProps = {
  entries: Entry[];
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: Entry) => void;
  emptyMessage?: string;
};

const PAGE_SIZE = 8;

export default function EntryList({
  entries,
  onDeleteEntry,
  onEditEntry,
  emptyMessage = "No entries match your current filters.",
}: EntryListProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedEntries = entries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pagedEntries.map((entry) => (
        <div
          key={entry.id}
          data-testid="entry-list-item"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-[var(--metric-primary)] hover:bg-white hover:shadow-md sm:p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-slate-900">{entry.title}</p>
              <p className="mt-1 break-words text-sm text-slate-500">
                {entry.category} - {formatDisplayDate(entry.date)}
              </p>
              {entry.note && (
                <p className="mt-2 break-words text-sm leading-6 text-slate-600">{entry.note}</p>
              )}
              {entry.metricType === "calories" && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  {entry.portionGrams !== null && (
                    <span className="max-w-full break-words rounded-full bg-white px-2.5 py-1 shadow-sm">
                      {formatMacroValue(entry.portionGrams)} portion
                    </span>
                  )}
                  {hasMacroData(entry) && (
                    <>
                      <span className="max-w-full break-words rounded-full bg-white px-2.5 py-1 shadow-sm">
                        Protein {formatMacroValue(entry.proteinGrams ?? 0)}
                      </span>
                      <span className="max-w-full break-words rounded-full bg-white px-2.5 py-1 shadow-sm">
                        Carbs {formatMacroValue(entry.carbsGrams ?? 0)}
                      </span>
                      <span className="max-w-full break-words rounded-full bg-white px-2.5 py-1 shadow-sm">
                        Fat {formatMacroValue(entry.fatGrams ?? 0)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 sm:text-right">
              <div className="inline-block max-w-full break-all rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm sm:break-normal">
                {metricConfigs[entry.metricType].formatValue(entry.value)}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[var(--metric-secondary)] hover:bg-[var(--metric-secondary-soft)]"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
