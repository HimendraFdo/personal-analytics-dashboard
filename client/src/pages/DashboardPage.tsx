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
import type { Entry } from "../types/entry";

//Initial entries to populate the dashboard with some sample data.
const INITIAL_ENTRIES: Entry[] = [
  {
    id: crypto.randomUUID(),
    title: "Study Hours",
    value: 2.5,
    category: "Study",
    date: new Date("2026-03-31"),
    note: "Worked on frontend layout",
  },
  {
    id: crypto.randomUUID(),
    title: "Expense",
    value: 18,
    category: "Finance",
    date: new Date("2026-03-30"),
    note: "Lunch and coffee",
  },
  {
    id: crypto.randomUUID(),
    title: "Workout",
    value: 45,
    category: "Health",
    date: new Date("2026-03-29"),
    note: "Evening gym session",
  },
];

//The main Dashboard page component that renders the layout and handles navigation between sections
export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState<NavigationItem>(
      NAVIGATION_ITEMS.DASHBOARD
  );
  
  //State to hold the list of entries displayed in the Entries section
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);

  //Function is called when a new entry is added through the EntryForm component
  function handleAddEntry(newEntry: Entry) {
    setEntries((currentEntries) => [newEntry, ...currentEntries]);
  }

  //Function determines which section component to render based on the currently active navigation item
  function renderActiveSection() {
    if (activeItem === NAVIGATION_ITEMS.DASHBOARD) {
      return <DashboardSection activeItem={activeItem} entries={entries} />;
    }

    if (activeItem === NAVIGATION_ITEMS.ENTRIES) {
      return (
        <EntriesSection
          entries={entries}
          onAddEntry={handleAddEntry}
        />
      );
    }

    if (activeItem === NAVIGATION_ITEMS.ANALYTICS) {
      return <AnalyticsSection entries={entries} />;
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

  //The main render method that displays the DashboardLayout and the currently active section
  return (
    <DashboardLayout activeItem={activeItem} onSelectItem={setActiveItem}>
      {renderActiveSection()}
    </DashboardLayout>
  );
}
  
