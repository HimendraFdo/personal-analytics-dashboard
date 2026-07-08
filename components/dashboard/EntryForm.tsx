"use client";

import { useState } from "react";
import { searchFoods } from "@/lib/api";
import {
  calculatePortionNutrition,
  type FoodSearchResult,
} from "@/lib/nutrition";
import type { Entry, EntryCategory } from "@/types/entry";
import { DEFAULT_ENTRY_CATEGORIES } from "@/types/entry";
import type { EntryFormPayload } from "@/hooks/useEntries";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import { formatDateTimeForInput } from "@/utils/date";

type EntryFormProps = {
  onSubmitEntry: (payload: EntryFormPayload) => void | Promise<void>;
  editingEntry: Entry | null;
  onCancelEdit: () => void;
  disabled?: boolean;
  categories: string[];
};

const inputFocusClasses =
  "focus:border-[var(--metric-primary)] focus:ring-[var(--metric-ring)]";

type FormData = {
  title: string;
  value: string;
  category: EntryCategory;
  date: string;
  note: string;
  foodName: string;
  portionGrams: string;
  proteinGrams: string;
  carbsGrams: string;
  fatGrams: string;
  foodSource: string;
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
      date: formatDateTimeForInput(editingEntry.date),
      note: editingEntry.note,
      foodName: editingEntry.foodName ?? "",
      portionGrams: editingEntry.portionGrams?.toString() ?? "",
      proteinGrams: editingEntry.proteinGrams?.toString() ?? "",
      carbsGrams: editingEntry.carbsGrams?.toString() ?? "",
      fatGrams: editingEntry.fatGrams?.toString() ?? "",
      foodSource: editingEntry.foodSource ?? "",
    };
  }

  return {
    title: "",
    value: "",
    category: "",
    date: formatDateTimeForInput(new Date()),
    note: "",
    foodName: "",
    portionGrams: "",
    proteinGrams: "",
    carbsGrams: "",
    fatGrams: "",
    foodSource: "",
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
  categories,
}: EntryFormProps) {
  const { activeMetric, metricConfig } = useMetricSelection();
  const { placeholders, valueInput } = metricConfig;
  const isCalories = activeMetric === "calories";
  const showsCategory = activeMetric === "time";
  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(editingEntry)
  );
  const [errors, setErrors] = useState<FormErrors>(() => getInitialErrors());
  const [submitting, setSubmitting] = useState(false);
  const [calorieEntryMode, setCalorieEntryMode] = useState<"manual" | "food">(
    editingEntry?.foodName ? "food" : "manual"
  );
  const [foodQuery, setFoodQuery] = useState(editingEntry?.foodName ?? "");
  const [foodResults, setFoodResults] = useState<FoodSearchResult[]>([]);
  const [foodSearchError, setFoodSearchError] = useState<string | null>(null);
  const [foodSearching, setFoodSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);

  // Keep the entry's original category selectable even if it was removed in Settings
  const categoryOptions =
    formData.category && !categories.includes(formData.category)
      ? [formData.category, ...categories]
      : categories;
  const selectedCategory = formData.category || categoryOptions[0] || "";

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
      nextErrors.value = `${metricConfig.label} is required.`;
    } else if (Number.isNaN(Number(formData.value))) {
      nextErrors.value = `${metricConfig.label} must be a valid number.`;
    } else if (Number(formData.value) <= 0) {
      nextErrors.value = `${metricConfig.label} must be greater than 0.`;
    }

    if (!formData.date) {
      nextErrors.date = "Date and time are required.";
    }

    if (isCalories && calorieEntryMode === "food" && !formData.foodName.trim()) {
      nextErrors.title = "Choose a food result before saving.";
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
      category: showsCategory
        ? selectedCategory || DEFAULT_ENTRY_CATEGORIES[activeMetric]
        : DEFAULT_ENTRY_CATEGORIES[activeMetric],
      date: new Date(formData.date),
      note: formData.note.trim(),
      foodName: isCalories ? formData.foodName.trim() || null : null,
      portionGrams:
        isCalories && formData.portionGrams
          ? Number(formData.portionGrams)
          : null,
      proteinGrams:
        isCalories && formData.proteinGrams
          ? Number(formData.proteinGrams)
          : null,
      carbsGrams:
        isCalories && formData.carbsGrams
          ? Number(formData.carbsGrams)
          : null,
      fatGrams:
        isCalories && formData.fatGrams ? Number(formData.fatGrams) : null,
      foodSource: isCalories ? formData.foodSource.trim() || null : null,
    };

    setSubmitting(true);
    try {
      await onSubmitEntry(payload);
      setErrors(getInitialErrors());
      if (!editingEntry) {
        setFormData(getInitialFormData(null));
        setFoodQuery("");
        setFoodResults([]);
        setSelectedFood(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFoodSearch() {
    const query = foodQuery.trim();
    if (query.length < 2) {
      setFoodSearchError("Enter at least 2 characters to search foods.");
      return;
    }

    setFoodSearching(true);
    setFoodSearchError(null);
    try {
      const foods = await searchFoods(query);
      setFoodResults(foods);
      if (foods.length === 0) {
        setFoodSearchError("No matching foods found.");
      }
    } catch (error) {
      setFoodSearchError(
        error instanceof Error ? error.message : "Food lookup failed"
      );
    } finally {
      setFoodSearching(false);
    }
  }

  function handleSelectFood(food: FoodSearchResult) {
    const portionGrams = Number(formData.portionGrams) > 0
      ? Number(formData.portionGrams)
      : 100;
    const nutrition = calculatePortionNutrition(
      food.nutrientsPer100g,
      portionGrams
    );

    setFormData((currentFormData) => ({
      ...currentFormData,
      title: currentFormData.title || food.name,
      value: String(nutrition.calories),
      foodName: food.name,
      portionGrams: String(portionGrams),
      proteinGrams: String(nutrition.proteinGrams),
      carbsGrams: String(nutrition.carbsGrams),
      fatGrams: String(nutrition.fatGrams),
      foodSource: food.source,
    }));
    setFoodQuery(food.name);
    setFoodResults([]);
    setSelectedFood(food);
    setErrors((currentErrors) => ({ ...currentErrors, title: "", value: "" }));
  }

  function handlePortionChange(event: React.ChangeEvent<HTMLInputElement>) {
    const portionGrams = event.target.value;
    const portionValue = Number(portionGrams);
    const nutrition =
      calorieEntryMode === "food" && selectedFood && portionValue > 0
        ? calculatePortionNutrition(selectedFood.nutrientsPer100g, portionValue)
        : null;

    setFormData((currentFormData) => ({
      ...currentFormData,
      portionGrams,
      ...(nutrition
        ? {
            value: String(nutrition.calories),
            proteinGrams: String(nutrition.proteinGrams),
            carbsGrams: String(nutrition.carbsGrams),
            fatGrams: String(nutrition.fatGrams),
          }
        : {}),
    }));
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
          placeholder={placeholders.title}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${
            errors.title
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
              : `border-slate-200 ${inputFocusClasses}`
          }`}
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {metricConfig.inputLabel}
        </label>
        <input
          type="number"
          step={valueInput.step}
          name="value"
          value={formData.value}
          onChange={handleChange}
          disabled={disabled || submitting}
          placeholder={valueInput.placeholder}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${
            errors.value
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
              : `border-slate-200 ${inputFocusClasses}`
          }`}
        />
        {errors.value && (
          <p className="mt-2 text-sm text-red-600">{errors.value}</p>
        )}
      </div>

      {isCalories && (
        <div className="space-y-4 rounded-2xl border border-[var(--metric-ring)] bg-[var(--metric-primary-soft)]/60 p-3 sm:p-4">
          <div className="grid grid-cols-2 rounded-xl border border-[var(--metric-ring)] bg-white p-1 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setCalorieEntryMode("manual");
                setSelectedFood(null);
              }}
              className={`rounded-lg px-3 py-2 transition ${
                calorieEntryMode === "manual"
                  ? "bg-[var(--metric-primary)] text-white"
                  : "hover:bg-[var(--metric-primary-soft)]"
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setCalorieEntryMode("food")}
              className={`rounded-lg px-3 py-2 transition ${
                calorieEntryMode === "food"
                  ? "bg-[var(--metric-primary)] text-white"
                  : "hover:bg-[var(--metric-primary-soft)]"
              }`}
            >
              Food Lookup
            </button>
          </div>

          {calorieEntryMode === "food" && (
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Food
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="search"
                    value={foodQuery}
                    onChange={(event) => setFoodQuery(event.target.value)}
                    disabled={disabled || submitting || foodSearching}
                    placeholder="e.g. Greek yogurt"
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleFoodSearch()}
                    disabled={disabled || submitting || foodSearching}
                    className="w-full rounded-2xl bg-[var(--metric-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--metric-primary-dark)] disabled:opacity-60 sm:w-auto"
                  >
                    {foodSearching ? "Searching" : "Search"}
                  </button>
                </div>
                {foodSearchError && (
                  <p className="mt-2 text-sm text-[var(--metric-primary-dark)]">{foodSearchError}</p>
                )}
              </div>

              {foodResults.length > 0 && (
                <div className="space-y-2">
                  {foodResults.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => handleSelectFood(food)}
                      className="w-full rounded-2xl border border-[var(--metric-ring)] bg-white p-3 text-left transition hover:border-[var(--metric-primary)]"
                    >
                      <span className="block text-sm font-semibold text-slate-900">
                        {food.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {food.brand} - {metricConfig.formatValue(food.nutrientsPer100g.calories)} / 100 g
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Portion (grams)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              name="portionGrams"
              value={formData.portionGrams}
              onChange={handlePortionChange}
              disabled={disabled || submitting}
              placeholder="e.g. 150"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["proteinGrams", "Protein", formData.proteinGrams],
              ["carbsGrams", "Carbs", formData.carbsGrams],
              ["fatGrams", "Fat", formData.fatGrams],
            ].map(([name, label, value]) => (
              <div key={name}>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  name={name}
                  value={value}
                  onChange={handleChange}
                  disabled={disabled || submitting}
                  placeholder="0"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {showsCategory && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            name="category"
            value={selectedCategory}
            onChange={handleChange}
            disabled={disabled || submitting}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Date and time
        </label>
        <input
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          disabled={disabled || submitting}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${
            errors.date
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
              : `border-slate-200 ${inputFocusClasses}`
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
          placeholder={placeholders.note}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={disabled || submitting}
          className="flex-1 rounded-2xl bg-[var(--metric-panel-strong)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--metric-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--metric-primary-dark)] disabled:opacity-60"
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
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
