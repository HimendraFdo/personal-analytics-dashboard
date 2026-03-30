import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardSection from "../components/dashboard/DashboardSection";
import EntriesSection from "../components/dashboard/EntriesSection";
import AnalyticsSection from "../components/dashboard/AnalyticsSection";
import EmptySection from "../components/dashboard/EmptySection";
import GoalsSection from "../components/dashboard/GoalsSection";
import SettingsSection from "../components/dashboard/SettingsSection";
import HelpSection from "../components/dashboard/HelpSection";
import ReportsSection from "../components/dashboard/ReportsSection";
import { NAVIGATION_ITEMS, type NavigationItem } from "../constants/navigation";

export default function DashboardPage() {
    const [activeItem, setActiveItem] = useState<NavigationItem>(
        NAVIGATION_ITEMS.DASHBOARD
    );

  function renderActiveSection() {
    if (activeItem === NAVIGATION_ITEMS.DASHBOARD) {
      return <DashboardSection activeItem={activeItem} />;
    }

    if (activeItem === NAVIGATION_ITEMS.ENTRIES) {
      return <EntriesSection />;
    }

    if (activeItem === NAVIGATION_ITEMS.ANALYTICS) {
        return <AnalyticsSection />;
    }

    if (activeItem === NAVIGATION_ITEMS.REPORTS) {
        return <ReportsSection />;
    }

    if (activeItem === NAVIGATION_ITEMS.GOALS) {
        return <GoalsSection />;
    }

    if (activeItem === NAVIGATION_ITEMS.SETTINGS) {
        return <SettingsSection />;
    }

    if (activeItem === NAVIGATION_ITEMS.HELP) {
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
  
