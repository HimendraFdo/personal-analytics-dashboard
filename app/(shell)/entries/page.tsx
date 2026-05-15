"use client";

import EntriesSection from "@/components/dashboard/EntriesSection";
import PageStatus from "@/components/dashboard/PageStatus";
import { useEntriesContext } from "@/contexts/EntriesContext";

export default function EntriesPage() {
  const { entries, loading, error, reload, addEntry, updateEntry, deleteEntry } =
    useEntriesContext();

  if (loading || error) {
    return <PageStatus loading={loading} error={error} onRetry={() => void reload()} />;
  }

  return (
    <EntriesSection
      entries={entries}
      onAddEntry={async (payload) => {
        await addEntry(payload);
      }}
      onUpdateEntry={async (id, payload) => {
        await updateEntry(id, payload);
      }}
      onDeleteEntry={deleteEntry}
    />
  );
}
