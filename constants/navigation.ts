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

export const NAV_PATHS: Record<NavigationItem, string> = {
  [NAVIGATION_ITEMS.DASHBOARD]: "/dashboard",
  [NAVIGATION_ITEMS.ENTRIES]: "/entries",
  [NAVIGATION_ITEMS.ANALYTICS]: "/analytics",
};

export function getNavItemFromPath(pathname: string): NavigationItem {
  if (pathname.startsWith("/entries")) {
    return NAVIGATION_ITEMS.ENTRIES;
  }
  if (pathname.startsWith("/analytics")) {
    return NAVIGATION_ITEMS.ANALYTICS;
  }
  return NAVIGATION_ITEMS.DASHBOARD;
}
