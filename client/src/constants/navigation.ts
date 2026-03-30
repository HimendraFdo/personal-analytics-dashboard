export const NAVIGATION_ITEMS = {
  DASHBOARD: "Dashboard",
  ENTRIES: "Entries",
  ANALYTICS: "Analytics",
  REPORTS: "Reports",
  GOALS: "Goals",
  SETTINGS: "Settings",
  HELP: "Help",
} as const;

export type NavigationItem =
  (typeof NAVIGATION_ITEMS)[keyof typeof NAVIGATION_ITEMS];

export const MAIN_NAV_ITEMS: NavigationItem[] = [
  NAVIGATION_ITEMS.DASHBOARD,
  NAVIGATION_ITEMS.ENTRIES,
  NAVIGATION_ITEMS.ANALYTICS,
  NAVIGATION_ITEMS.REPORTS,
];

export const WORKSPACE_NAV_ITEMS: NavigationItem[] = [
  NAVIGATION_ITEMS.GOALS,
  NAVIGATION_ITEMS.SETTINGS,
  NAVIGATION_ITEMS.HELP,
];