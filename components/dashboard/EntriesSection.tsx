"use client";

import { useMemo, useState } from "react";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import type { Entry, EntryCategory } from "@/types/entry";
import type { EntryFormPayload } from "@/hooks/useEntries";
import { formatDateForInput } from "@/utils/date";

type EntriesSectionProps = {
  entries: Entry[];
  saving?: boolean;
  onAddEntry: (payload: EntryFormPayload) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onUpdateEntry: (id: string, payload: EntryFormPayload) => Promise<void>;
};

type SortOption = "Newest" | "Oldest" | "Highest Time" | "Lowest Time";

const SORT_OPTIONS: SortOption[] = [
  "Newest",
  "Oldest",
  "Highest Time",
  "Lowest Time",
];

const CATEGORY_OPTIONS: Array<"All" | EntryCategory> = [
  "All",
  "Study",
  "Finance",
  "Health",
  "Personal",
];

export default function EntriesSection({
  entries,
  saving = false,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
}: EntriesSectionProps) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"All" | EntryCategory>("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSort, setSelectedSort] = useState<SortOption>("Newest");
  const [actionError, setActionError] = useState<string | null>(null);

  function handleStartEdit(entry: Entry) {
    setEditingEntry(entry);
  }

  function handleCancelEdit() {
    setEditingEntry(null);
  }

  async function handleSubmitEntry(payload: EntryFormPayload) {
    setActionError(null);
    try {
      if (editingEntry) {
        await onUpdateEntry(editingEntry.id, payload);
        setEditingEntry(null);
      } else {
        await onAddEntry(payload);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to save entry"
      );
    }
  }

  async function handleDelete(entryId: string) {
    setActionError(null);
    try {
      await onDeleteEntry(entryId);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete entry"
      );
    }
  }

  function handleClearFilters() {
    setSelectedCategory("All");
    setSelectedDate("");
    setSelectedSort("Newest");
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCategory =
        selectedCategory === "All" || entry.category === selectedCategory;

      const matchesDate =
        selectedDate === "" || formatDateForInput(entry.date) === selectedDate;

      return matchesCategory && matchesDate;
    });
  }, [entries, selectedCategory, selectedDate]);

  const sortedEntries = useMemo(() => {
    const next = [...filteredEntries];
    if (selectedSort === "Newest") {
      next.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (selectedSort === "Oldest") {
      next.sort((a, b) => a.date.getTime() - b.date.getTime());
    } else if (selectedSort === "Highest Time") {
      next.sort((a, b) => b.value - a.value);
    } else if (selectedSort === "Lowest Time") {
      next.sort((a, b) => a.value - b.value);
    }
    return next;
  }, [filteredEntries, selectedSort]);

  const hasNoEntries = entries.length === 0;
  const listEmptyMessage = hasNoEntries
    ? "No entries yet. Add your first entry using the form."
    : "No entries match your current filters.";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Entries</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add, edit, filter, and review your tracked time entries.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {sortedEntries.length} visible
          </div>
        </div>
      </section>

      {actionError && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </section>
      )}

      {hasNoEntries && (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">No entries yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Start tracking study, finance, health, or personal time with your first entry.
          </p>
        </section>
      )}

      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">Filters and Sorting</h3>
          <p className="mt-1 text-sm text-slate-500">
            Narrow down your entries and control the display order.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Sort by
            </label>
            <select
              value={selectedSort}
              onChange={(event) => setSelectedSort(event.target.value as SortOption)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as "All" | EntryCategory)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing {filteredEntries.length} of {entries.length} entries
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingEntry ? "Edit Entry" : "Add New Entry"}
          </h3>

          <div className="mt-6">
            <EntryForm
              key={editingEntry ? editingEntry.id : "new-entry-form"}
              onSubmitEntry={handleSubmitEntry}
              editingEntry={editingEntry}
              onCancelEdit={handleCancelEdit}
              disabled={saving}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">Entry History</h3>

          <div className="mt-6">
            <EntryList
              entries={sortedEntries}
              onDeleteEntry={(id) => void handleDelete(id)}
              onEditEntry={handleStartEdit}
              emptyMessage={listEmptyMessage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
