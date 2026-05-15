"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEntry,
  deleteEntry as deleteEntryApi,
  fetchEntries,
  updateEntry as updateEntryApi,
} from "@/lib/api";
import type { Entry, EntryInput } from "@/types/entry";
import { formatDateForInput } from "@/utils/date";

export type EntryFormPayload = {
  title: string;
  value: number;
  category: Entry["category"];
  date: Date;
  note: string;
};

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (payload: EntryFormPayload) => {
    const input: EntryInput = {
      title: payload.title,
      value: payload.value,
      category: payload.category,
      date: formatDateForInput(payload.date),
      note: payload.note,
    };
    const created = await createEntry(input);
    setEntries((current) => [created, ...current]);
    return created;
  }, []);

  const updateEntry = useCallback(
    async (id: string, payload: EntryFormPayload) => {
      const updated = await updateEntryApi(id, {
        title: payload.title,
        value: payload.value,
        category: payload.category,
        date: formatDateForInput(payload.date),
        note: payload.note,
      });
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? updated : entry))
      );
      return updated;
    },
    []
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
