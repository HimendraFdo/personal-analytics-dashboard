"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { METRIC_TYPES, metricConfigs } from "@/lib/metrics";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import { getNavItemFromPath, NAV_PATHS, NAVIGATION_ITEMS } from "@/constants/navigation";

const metricTabActiveClasses = {
  teal: "bg-teal-700 text-white shadow-sm",
  emerald: "bg-emerald-700 text-white shadow-sm",
  orange: "bg-orange-600 text-white shadow-sm",
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
    <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-white/70 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900">{activeItem}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your activity, trends and recent entries.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white/80 p-1 text-sm font-semibold text-slate-600 shadow-sm"
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
                className={`rounded-xl px-3 py-2 transition ${
                  isActive
                    ? metricTabActiveClasses[config.accent]
                    : "hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <label className="relative block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search analytics"
            className="h-10 w-full rounded-2xl border border-slate-200 bg-white/80 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 sm:w-56"
          />
        </label>

        <Link
          href={addEntryHref}
          className="rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700"
        >
          Add Entry
        </Link>

        {user ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
              },
            }}
            fallback={
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {fallbackInitial}
              </div>
            }
          />
        ) : null}
      </div>
    </header>
  );
}
