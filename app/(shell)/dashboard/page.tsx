"use client";

import dynamic from "next/dynamic";
import PageStatus from "@/components/dashboard/PageStatus";
import { useEntriesContext } from "@/contexts/EntriesContext";

const DashboardSection = dynamic(
  () => import("@/components/dashboard/DashboardSection"),
  {
    loading: () => <PageStatus loading error={null} />,
  }
);

export default function DashboardPage() {
  const { entries, loading, error, reload } = useEntriesContext();

  if (loading || error) {
    return <PageStatus loading={loading} error={error} onRetry={() => void reload()} />;
  }

  return <DashboardSection entries={entries} />;
}
