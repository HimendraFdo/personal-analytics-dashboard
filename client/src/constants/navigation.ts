export const NAVIGATION_ITEMS = {
  DASHBOARD: "Dashboard",
  ENTRIES: "Entries",
  ANALYTICS: "Analytics",
} as const;

export type NavigationItem =
  (typeof NAVIGATION_ITEMS)[keyof typeof NAVIGATION_ITEMS];

export const MAIN_NAV_ITEMS: NavigationItem[] = [
  NAVIGATION_ITEMS.DASHBOARD,
  NAVIGATION_ITEMS.ENTRIES,
  NAVIGATION_ITEMS.ANALYTICS,
];
