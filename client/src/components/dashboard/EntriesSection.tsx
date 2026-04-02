import { useState } from "react";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import type { Entry } from "../../types/entry";

//Renders the Entries section of the Dashboard
type EntriesSectionProps = {
  entries: Entry[];
  onAddEntry: (entry: Entry) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entry: Entry) => void;
};

export default function EntriesSection({
  entries,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
}: EntriesSectionProps) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

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

  return (
   <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Entries</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add, edit and review your tracked entries.
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
              entries={entries}
              onDeleteEntry={onDeleteEntry}
              onEditEntry={handleStartEdit} 
            />
          </div>
        </div>
      </section>
    </div>
  );
}