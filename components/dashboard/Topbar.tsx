"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { METRIC_TYPES, metricConfigs } from "@/lib/metrics";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import { getNavItemFromPath, NAV_PATHS, NAVIGATION_ITEMS } from "@/constants/navigation";

const metricTabActiveClasses = {
  teal: "bg-[var(--metric-primary)] text-[var(--metric-text-on-primary)] shadow-sm shadow-[var(--metric-shadow)]",
  emerald: "bg-[var(--metric-primary)] text-[var(--metric-text-on-primary)] shadow-sm shadow-[var(--metric-shadow)]",
  orange: "bg-[var(--metric-primary)] text-[var(--metric-text-on-primary)] shadow-sm shadow-[var(--metric-shadow)]",
};

export default function Topbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeItem = getNavItemFromPath(pathname);
  const { activeMetric, setActiveMetric } = useMetricSelection();
  const { user } = useUser();
  const displayName = user?.unsafeMetadata.displayName;
  const fallbackInitial =
    typeof displayName === "string" && displayName.trim()
      ? displayName.trim().charAt(0).toUpperCase()
      : user?.firstName?.charAt(0).toUpperCase() ?? "U";

  const addEntryParams = new URLSearchParams(searchParams.toString());
  addEntryParams.set("metric", activeMetric);
  const addEntryHref = `${NAV_PATHS[NAVIGATION_ITEMS.ENTRIES]}?${addEntryParams.toString()}`;

  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-white/70 bg-white/85 px-3 py-3 shadow-sm shadow-[var(--metric-shadow)] backdrop-blur-xl transition-colors duration-500 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{activeItem}</h1>
        <p className="mt-1 hidden text-sm text-slate-500 sm:block">
          Monitor your {metricConfigs[activeMetric].label.toLowerCase()} trends and recent entries.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div
          className="grid grid-cols-3 rounded-2xl border border-slate-200/80 bg-white/80 p-1 text-sm font-semibold text-slate-600 shadow-sm"
          aria-label="Metric tabs"
        >
          {METRIC_TYPES.map((metricType) => {
            const config = metricConfigs[metricType];
            const isActive = metricType === activeMetric;

            return (
              <button
                key={metricType}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveMetric(metricType)}
                className={`min-h-11 rounded-xl px-2 py-2 transition sm:px-3 ${
                  isActive
                    ? metricTabActiveClasses[config.accent]
                    : "hover:bg-[var(--metric-primary-soft)] hover:text-slate-950"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <label className="relative min-w-0 flex-1 lg:block lg:flex-none">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search analytics"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)] sm:pl-10 sm:pr-4 lg:w-56"
            />
          </label>

          <Link
            href={addEntryHref}
            className="flex min-h-11 shrink-0 items-center rounded-2xl bg-[var(--metric-panel-strong)] px-3 text-center text-sm font-semibold text-white shadow-lg shadow-[var(--metric-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--metric-primary-dark)] sm:px-4"
          >
            Add Entry
          </Link>

          {user ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonTrigger: "h-11 w-11",
                    avatarBox: "h-10 w-10",
                  },
                }}
                fallback={
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    {fallbackInitial}
                  </div>
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
