const SHELL_ROUTE_SEGMENTS = new Set(["dashboard", "entries", "analytics"]);

export function getCanonicalPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const startsWithShellRoute = SHELL_ROUTE_SEGMENTS.has(segments[0] ?? "");
  const shellRouteIndex = startsWithShellRoute
    ? segments.findIndex((segment, index) => {
        return index > 0 && SHELL_ROUTE_SEGMENTS.has(segment);
      })
    : -1;

  if (shellRouteIndex !== -1) {
    return `/${segments.slice(shellRouteIndex).join("/")}`;
  }

  const collapsedPathname = pathname.replace(/\/{2,}/g, "/");
  return collapsedPathname === "" ? "/" : collapsedPathname;
}
