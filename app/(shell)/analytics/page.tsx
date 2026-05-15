"use client";

import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import PageStatus from "@/components/dashboard/PageStatus";
import { useEntriesContext } from "@/contexts/EntriesContext";

export default function AnalyticsPage() {
  const { entries, loading, error, reload } = useEntriesContext();

  if (loading || error) {
    return <PageStatus loading={loading} error={error} onRetry={() => void reload()} />;
  }

  return <AnalyticsSection entries={entries} />;
}
