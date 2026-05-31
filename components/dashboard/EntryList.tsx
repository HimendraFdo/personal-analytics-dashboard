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

export default function EntryList({
  entries,
  onDeleteEntry,
  onEditEntry,
  emptyMessage = "No entries match your current filters.",
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
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
    </div>
  );
}
