import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import type { Entry } from "../../types/entry";

//Renders the Entries section of the Dashboard
type EntriesSectionProps = {
  entries: Entry[];
  onAddEntry: (entry: Entry) => void;
};

export default function EntriesSection({
  entries,
  onAddEntry
}: EntriesSectionProps) {
  return (
   <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Entries</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add new tracked items and review your existing entries.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Add New Entry</h3>
          <div className="mt-6">
            <EntryForm onAddEntry={onAddEntry} />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Entry History</h3>
          <div className="mt-6">
            <EntryList entries={entries} />
          </div>
        </div>
      </section>
    </div>
  );
}