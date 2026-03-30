import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardSection from "../components/dashboard/DashboardSection";
import EntriesSection from "../components/dashboard/EntriesSection";
import AnalyticsSection from "../components/dashboard/AnalyticsSection";
import EmptySection from "../components/dashboard/EmptySection";
import GoalsSection from "../components/dashboard/GoalsSection";
import SettingsSection from "../components/dashboard/SettingsSection";
import HelpSection from "../components/dashboard/HelpSection";
import TrendsSection from "../components/dashboard/TrendsSection";

export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState("Dashboard");

  function renderActiveSection() {
    if (activeItem === "Dashboard") {
      return <DashboardSection activeItem={activeItem} />;
    }

    if (activeItem === "Entries") {
      return <EntriesSection />;
    }

    if (activeItem === "Trends") {
        return <TrendsSection />;
    }

    if (activeItem === "Analytics") {
        return <AnalyticsSection />;
    }

    if (activeItem === "Goals") {
        return <GoalsSection />;
    }

    if (activeItem === "Settings") {
        return <SettingsSection />;
    }

    if (activeItem === "Help") {
        return <HelpSection />;
    }

    return <EmptySection title={activeItem} />;
  }

  return (
    <DashboardLayout activeItem={activeItem} onSelectItem={setActiveItem}>
      {renderActiveSection()}
    </DashboardLayout>
  );
}
  
