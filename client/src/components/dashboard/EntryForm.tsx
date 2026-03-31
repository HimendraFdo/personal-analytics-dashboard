import { useState } from "react";
import { type Entry, type EntryCategory } from "../../types/entry";

//Renders a form for adding an entry to the Dashboard
type EntryFormProps = {
    onAddEntry: (entry:Entry) => void;
};

//Defines the only categories an entry can have
const CATEGORIES: EntryCategory[] = [
    "Study",
    "Finance",
    "Health",
    "Personal"
    
];

//Method renders a form to handle adding an entry to the dashboard
export default function EntryForm({onAddEntry}: EntryFormProps) {
    const [title, setTitle] = useState("");
    const [value, setValue] = useState(0);
    const [category, setCategory] = useState<EntryCategory>("Study");
    const [date, setDate] = useState("");
    const [note, setNote] = useState("");

    //This runs when a form is submitted
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); //Prevents the form submission from reloading the page

        //Checks if required fields are missing
        if (!title.trim() || !String(value).trim() || !date) {
            return;
        }

        //Object representing the new entry
        const newEntry: Entry = {
            id: crypto.randomUUID(),
            title: title.trim(),
            value: Number(value),
            category,
            date: new Date(date),
            note: note.trim()
        };

        //Passes the entry to the parent through the function prop
        onAddEntry(newEntry);

        //Resetting all the form fields to their default values
        setTitle("");
        setValue(0);
        setCategory("Study");
        setDate("");
        setNote("");
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/*Title input field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Title
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
            </div>

            {/*Value input field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Value
                </label>
                <input
                    type="number"
                    value={value}
                    onChange={(event) => setValue(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
            </div>

            {/*Category select field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Category
                </label>
                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as EntryCategory)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    >
                        {CATEGORIES.map((Option) => (
                            <option key={Option} value={Option}>
                                {Option}
                            </option>
                        ))}
                </select>
            </div>

            {/*Date input field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Date
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
            </div>

            {/*Note input field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Note
                </label>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional note"
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
            </div>

            {/*Add Entry button*/}
            <button 
              type="submit" 
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
                Add Entry
            </button>
        </form>
    );
};