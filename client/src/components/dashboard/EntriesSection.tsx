import { useMemo, useState } from "react";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import type { Entry, EntryCategory } from "../../types/entry";
import { formatDateForInput } from "../../utils/date";

//Renders the Entries section of the Dashboard
type EntriesSectionProps = {
  entries: Entry[];
  onAddEntry: (entry: Entry) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entry: Entry) => void;
};

const CATEGORY_OPTIONS: Array<"All" | EntryCategory> = [
  "All",
  "Study",
  "Finance",
  "Health",
  "Personal",
];

export default function EntriesSection({
  entries,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
}: EntriesSectionProps) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"All" | EntryCategory>("All");
  const [selectedDate, setSelectedDate] = useState("");

  function handleStartEdit(entry: Entry) {
    setEditingEntry(entry);
  }

  function handleCancelEdit() {
    setEditingEntry(null);
  }

  function handleSubmitEntry(entry: Entry) {
    if(editingEntry) {
      onUpdateEntry(entry);
      setEditingEntry(null);
    } else {
      onAddEntry(entry);
    }
  }

  function handleClearFilters() {
    setSelectedCategory("All");
    setSelectedDate("");
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCategory =
        selectedCategory === "All" || entry.category === selectedCategory;

      const matchesDate = 
        selectedDate === "" ||
        formatDateForInput(entry.date) ===selectedDate;
      
      return matchesCategory && matchesDate;
    });
  }, [entries, selectedCategory, selectedDate]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Entries</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add, edit, filter, and review your tracked entries.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as "All" | EntryCategory)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <div className="lg:w-auto">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:w-auto"
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
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingEntry ? "Edit Entry" : "Add New Entry"}
          </h3>

          <div className="mt-6">
            <EntryForm
              key={editingEntry ? editingEntry.id : "new-entry-form"}
              onSubmitEntry={handleSubmitEntry}
              editingEntry={editingEntry}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Entry History</h3>

          <div className="mt-6">
            <EntryList
              entries={filteredEntries}
              onDeleteEntry={onDeleteEntry}
              onEditEntry={handleStartEdit}
            />
          </div>
        </div>
      </section>
    </div>
  );
}