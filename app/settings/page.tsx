"use client";

import dynamic from "next/dynamic";
import PageStatus from "@/components/dashboard/PageStatus";

const SettingsSection = dynamic(
  () => import("@/components/settings/SettingsSection"),
  {
    loading: () => <PageStatus loading error={null} />,
  }
);

export default function SettingsPage() {
  return <SettingsSection />;
}
