import { useEffect, useState } from "react";
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
import { parseStoredDate } from "../utils/date";

const STORAGE_KEY = "personal-analytics-dashboard-entries";

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

// Loads stored entries from localStorage
function getStoredEntries(): Entry[] {
  const storedEntries = localStorage.getItem(STORAGE_KEY);

  if(!storedEntries) {
    return INITIAL_ENTRIES;
  }

  try {
    const parsedEntries = JSON.parse(storedEntries);

    if(!Array.isArray(parsedEntries)) {
      return INITIAL_ENTRIES;
    }

    return parsedEntries.map((entry) => ({
      ...entry,
      date: parseStoredDate(entry.date),
    }));
  } catch {
    return INITIAL_ENTRIES;
  }
}

//The main Dashboard page component that renders the layout and handles navigation between sections
export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState<NavigationItem>(
      NAVIGATION_ITEMS.DASHBOARD
  );
  
  //State to hold the list of entries displayed in the Entries section
  const [entries, setEntries] = useState<Entry[]>(getStoredEntries);

  // Saves the list of entries after converting to string and saving in localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  //Function is called when a new entry is added through the EntryForm component
  function handleAddEntry(newEntry: Entry) {
    setEntries((currentEntries) => [newEntry, ...currentEntries]);
  }

  //Function to delete entries
  function handleDeleteEntry(entryId: string) {
    setEntries((currentEntries) => 
      currentEntries.filter((entry) => entry.id !== entryId)
    );
  }

  //Function to update an existing entry
  function handleUpdateEntry(updatedEntry: Entry) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
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
          onDeleteEntry={handleDeleteEntry}
          onUpdateEntry={handleUpdateEntry}
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
  
