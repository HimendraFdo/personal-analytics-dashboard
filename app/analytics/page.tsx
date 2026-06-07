"use client";

import dynamic from "next/dynamic";
import PageStatus from "@/components/dashboard/PageStatus";
import { useEntriesContext } from "@/contexts/EntriesContext";

const AnalyticsSection = dynamic(
  () => import("@/components/dashboard/AnalyticsSection"),
  {
    loading: () => <PageStatus loading error={null} />,
  }
);

export default function AnalyticsPage() {
  const { entries, loading, error, reload } = useEntriesContext();

  if (loading || error) {
    return <PageStatus loading={loading} error={error} onRetry={() => void reload()} />;
  }

  return <AnalyticsSection entries={entries} />;
}
