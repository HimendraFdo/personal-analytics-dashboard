import type { Entry } from "../../types/entry";

//Renders a list of entries on the Dashboard
type EntryListProps = {
    entries: Entry[];
};

//Renders a list of entries or a message if there are no entries in the list
export default function EntryList({ entries }: EntryListProps) {
    if(entries.length === 0) {
        return (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No entries yet. Add your first entry.
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
                                {entry.category} • {new Date(entry.date).toLocaleDateString()}
                            </p>
                            {entry.note && (
                                <p className="mt-2 text-sm text-slate-600">
                                    {entry.note}
                                </p>
                            )}
                        </div>

                        <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                            {entry.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}