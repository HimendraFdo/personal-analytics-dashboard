import type { Entry } from "../../types/entry";
import { formatDisplayDate } from "../../utils/date";

//Renders a list of entries on the Dashboard
type EntryListProps = {
    entries: Entry[];
    onDeleteEntry: (entryId: string) => void;
    onEditEntry: (entry: Entry) => void;
    emptyMessage?: string;
};

//Renders a list of entries or a message if there are no entries in the list
export default function EntryList({ 
    entries,
    onDeleteEntry,
    onEditEntry,
    emptyMessage = "No entries match your current filters.",
}: EntryListProps) {
    if(entries.length === 0) {
        return (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Entry items will are looped through and rendered here*/}
            {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                {entry.title}
                            </p>
                            <p className="text-sm font-semibold text-slate-500">
                                {entry.category} • {formatDisplayDate(entry.date)}
                            </p>
                            {entry.note && (
                                <p className="mt-2 text-sm text-slate-600">
                                    {entry.note}
                                </p>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                                {entry.value}
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => onEditEntry(entry)}
                                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDeleteEntry(entry.id)}
                                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
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