import { useState } from "react";
import { type Entry, type EntryCategory } from "../../types/entry";
import { formatDateForInput } from "../../utils/date";


//Renders a form for adding, editing and canceling the edit of an entry to the Dashboard
type EntryFormProps = {
    onSubmitEntry: (entry:Entry) => void;
    editingEntry: Entry | null;
    onCancelEdit: () => void;
};

//Defines the only categories an entry can have
const CATEGORIES: EntryCategory[] = [
    "Study",
    "Finance",
    "Health",
    "Personal"
];

//Form Data State
type FormData = {
    title: string;
    value: string;
    category: EntryCategory;
    date: string;
    note: string;
};

type Error = {
    title: string;
    value: string;
    date: string;  
};

//Sets the initial form with empty or preset values
function getInitialFormData(editingEntry: Entry | null): FormData {
    if (editingEntry) {
        return {
            title: editingEntry.title,
            value: String(editingEntry.value),
            category: editingEntry.category,
            date: formatDateForInput(editingEntry.date),
            note: editingEntry.note,
        };
    }

    return {
        title: "",
        value: "",
        category: "Study",
        date: "",
        note: "",
    };
}

function getInitialErrors(): Error {
    return {
        title: "",
        value: "",
        date: "",
    };
}

//Method renders a form to handle adding an entry to the dashboard
export default function EntryForm({
    onSubmitEntry,
    editingEntry,
    onCancelEdit
}: EntryFormProps) {
    const [formData, setFormData] = useState<FormData>(() =>
        getInitialFormData(editingEntry)
    );

    const [errors, setErrors] = useState<Error>(() => getInitialErrors());

    //Checks the submitting or editing entry for errors
    function validateForm(): boolean{
        const nextErrors: Error = {
            title: "",
            value: "",
            date: "",
        };

        if(formData.title.trim() === "") {
            nextErrors.title = "Title is required.";
        };

        if (!formData.value.trim()) {
            nextErrors.value = "Value is required.";
        } else if(Number.isNaN(Number(formData.value))) {
            nextErrors.value = "Value must be a valid number.";
        } else if(Number(formData.value) <= 0) {
            nextErrors.value = "Value must be greater than 0.";
        };

        if (!formData.date) {
            nextErrors.date = "Date is Required";
        };

        setErrors(nextErrors);

        return !nextErrors.title && !nextErrors.value && !nextErrors.date;
    }

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = event.target;

        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));

        if (name === "title" || name === "value" || name === "date") {
            setErrors((currentErrors) => ({
                ...currentErrors,
                [name]: "",
            }));
        }
    }

    //This runs when a form is submitted
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); //Prevents the form submission from reloading the page

        const isValid = validateForm();
    
        //Checks if required fields are missing
        if (!isValid) {
            return;
        }

        //Object representing the new entry
        const submittedEntry: Entry = {
            id: editingEntry ? editingEntry.id : crypto.randomUUID(),
            title: formData.title.trim(),
            value: Number(formData.value),
            category: formData.category,
            date: new Date(formData.date),
            note: formData.note.trim(),
        };

        //Passes the entry to the parent through the function prop
        onSubmitEntry(submittedEntry);

        setErrors(getInitialErrors);
        
        //Resetting all the form fields to their default values
        if(!editingEntry){
            setFormData(getInitialFormData(null));
        }
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
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Study Hours"
                    className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition ${
                        errors.title
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-300 focus:border-slate-500"
                    }`}
                />
                {errors.title && (
                    <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                )}
            </div>

            {/*Value input field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Value
                </label>
                <input
                    type="number"
                    step="0.1"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition ${
                        errors.value
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-300 focus:border-slate-500"
                    }`}
                />
                {errors.value && (
                    <p className="mt-2 text-sm text-red-600">{errors.value}</p>
                )}
            </div>

            {/*Category select field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Category
                </label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
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
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition ${
                        errors.date
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-300 focus:border-slate-500"
                    }`}
                />
                {errors.date && (
                    <p className="mt-2 text-sm text-red-600">{errors.date}</p>
                )}
            </div>

            {/*Note input field*/}
            <div>
                <label className="mb-2 block tect-sm font-medium text-slate-700">
                    Note
                </label>
                <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Optional note"
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                />
            </div>

            {/*Add/Edit Entry button*/}
            <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                    {editingEntry ? "Save Changes" : "Add Entry"}
                </button>

                {editingEntry && (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};