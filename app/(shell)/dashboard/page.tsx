"use client";

import DashboardSection from "@/components/dashboard/DashboardSection";
import PageStatus from "@/components/dashboard/PageStatus";
import { useEntriesContext } from "@/contexts/EntriesContext";

export default function DashboardPage() {
  const { entries, loading, error, reload } = useEntriesContext();

  if (loading || error) {
    return <PageStatus loading={loading} error={error} onRetry={() => void reload()} />;
  }

  return <DashboardSection entries={entries} />;
}
