"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEntry,
  deleteEntry as deleteEntryApi,
  fetchEntries,
  updateEntry as updateEntryApi,
} from "@/lib/api";
import type { Entry, EntryInput } from "@/types/entry";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import { formatDateForInput } from "@/utils/date";

export type EntryFormPayload = {
  title: string;
  value: number;
  category: Entry["category"];
  date: Date;
  note: string;
  foodName?: string | null;
  portionGrams?: number | null;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
  foodSource?: string | null;
};

export function useEntries() {
  const { activeMetric } = useMetricSelection();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries({ metricType: activeMetric });
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [activeMetric]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (payload: EntryFormPayload) => {
    const input: EntryInput = {
      title: payload.title,
      value: payload.value,
      metricType: activeMetric,
      category: payload.category,
      date: formatDateForInput(payload.date),
      note: payload.note,
      foodName: payload.foodName ?? null,
      portionGrams: payload.portionGrams ?? null,
      proteinGrams: payload.proteinGrams ?? null,
      carbsGrams: payload.carbsGrams ?? null,
      fatGrams: payload.fatGrams ?? null,
      foodSource: payload.foodSource ?? null,
    };
    const created = await createEntry(input);
    setEntries((current) => [created, ...current]);
    return created;
  }, [activeMetric]);

  const updateEntry = useCallback(
    async (id: string, payload: EntryFormPayload) => {
      const updated = await updateEntryApi(id, {
        title: payload.title,
        value: payload.value,
        metricType: activeMetric,
        category: payload.category,
        date: formatDateForInput(payload.date),
        note: payload.note,
        foodName: payload.foodName ?? null,
        portionGrams: payload.portionGrams ?? null,
        proteinGrams: payload.proteinGrams ?? null,
        carbsGrams: payload.carbsGrams ?? null,
        fatGrams: payload.fatGrams ?? null,
        foodSource: payload.foodSource ?? null,
      });
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? updated : entry))
      );
      return updated;
    },
    [activeMetric]
  );

  const deleteEntry = useCallback(async (id: string) => {
    await deleteEntryApi(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  return {
    entries,
    loading,
    error,
    reload: loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
