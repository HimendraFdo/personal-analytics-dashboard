"use client";

import { useState } from "react";
import type { Entry, EntryCategory } from "@/types/entry";
import type { EntryFormPayload } from "@/hooks/useEntries";
import { formatDateForInput } from "@/utils/date";

type EntryFormProps = {
  onSubmitEntry: (payload: EntryFormPayload) => void | Promise<void>;
  editingEntry: Entry | null;
  onCancelEdit: () => void;
  disabled?: boolean;
};

const CATEGORIES: EntryCategory[] = [
  "Study",
  "Finance",
  "Health",
  "Personal",
];

type FormData = {
  title: string;
  value: string;
  category: EntryCategory;
  date: string;
  note: string;
};

type FormErrors = {
  title: string;
  value: string;
  date: string;
};

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

function getInitialErrors(): FormErrors {
  return {
    title: "",
    value: "",
    date: "",
  };
}

export default function EntryForm({
  onSubmitEntry,
  editingEntry,
  onCancelEdit,
  disabled = false,
}: EntryFormProps) {
  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(editingEntry)
  );
  const [errors, setErrors] = useState<FormErrors>(() => getInitialErrors());
  const [submitting, setSubmitting] = useState(false);

  function validateForm(): boolean {
    const nextErrors: FormErrors = {
      title: "",
      value: "",
      date: "",
    };

    if (formData.title.trim() === "") {
      nextErrors.title = "Title is required.";
    }

    if (!formData.value.trim()) {
      nextErrors.value = "Value is required.";
    } else if (Number.isNaN(Number(formData.value))) {
      nextErrors.value = "Value must be a valid number.";
    } else if (Number(formData.value) <= 0) {
      nextErrors.value = "Value must be greater than 0.";
    }

    if (!formData.date) {
      nextErrors.date = "Date is required.";
    }

    setErrors(nextErrors);
    return !nextErrors.title && !nextErrors.value && !nextErrors.date;
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm() || disabled || submitting) {
      return;
    }

    const payload: EntryFormPayload = {
      title: formData.title.trim(),
      value: Number(formData.value),
      category: formData.category,
      date: new Date(formData.date),
      note: formData.note.trim(),
    };

    setSubmitting(true);
    try {
      await onSubmitEntry(payload);
      setErrors(getInitialErrors());
      if (!editingEntry) {
        setFormData(getInitialFormData(null));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={disabled || submitting}
          placeholder="e.g. Study Hours"
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
            errors.title
              ? "border-red-500 focus:border-red-500"
              : "border-slate-300 focus:border-slate-500"
          }`}
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Value
        </label>
        <input
          type="number"
          step="0.1"
          name="value"
          value={formData.value}
          onChange={handleChange}
          disabled={disabled || submitting}
          placeholder="e.g. 2.5"
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
            errors.value
              ? "border-red-500 focus:border-red-500"
              : "border-slate-300 focus:border-slate-500"
          }`}
        />
        {errors.value && (
          <p className="mt-2 text-sm text-red-600">{errors.value}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          disabled={disabled || submitting}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          disabled={disabled || submitting}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
            errors.date
              ? "border-red-500 focus:border-red-500"
              : "border-slate-300 focus:border-slate-500"
          }`}
        />
        {errors.date && (
          <p className="mt-2 text-sm text-red-600">{errors.date}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Note
        </label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          disabled={disabled || submitting}
          placeholder="Optional note"
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={disabled || submitting}
          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting
            ? "Saving..."
            : editingEntry
              ? "Save Changes"
              : "Add Entry"}
        </button>

        {editingEntry && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={disabled || submitting}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
