"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getNavItemFromPath,
  MAIN_NAV_ITEMS,
  NAV_PATHS,
  type NavigationItem,
} from "@/constants/navigation";
import { metricConfigs, parseMetricType } from "@/lib/metrics";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeItem = getNavItemFromPath(pathname);
  const activeMetric = parseMetricType(searchParams.get("metric"));
  const metricConfig = metricConfigs[activeMetric];

  function isActive(item: NavigationItem) {
    return item === activeItem;
  }

  function getHref(item: NavigationItem) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("metric", activeMetric);
    return `${NAV_PATHS[item]}?${nextParams.toString()}`;
  }

  return (
    <aside className="hidden w-72 flex-col border-r border-white/10 bg-[var(--metric-panel-strong)] text-white shadow-2xl shadow-[var(--metric-shadow)] transition-colors duration-500 md:flex">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--metric-primary-soft)] text-sm font-black text-[var(--metric-panel-strong)] shadow-lg shadow-[var(--metric-shadow)] transition-colors duration-500">
            PAD
          </div>
          <div>
            <h2 className="text-xl font-bold">PAD</h2>
            <p className="text-xs font-medium text-white/70">
              {metricConfig.label} workspace
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Personal Analytics Dashboard
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div>
          <p className="px-3 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main
          </p>

          <ul className="space-y-2">
            {MAIN_NAV_ITEMS.map((item) => (
              <li key={item}>
                <Link
                  href={getHref(item)}
                  className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive(item)
                      ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item}</span>
                  <span
                    className={`h-2 w-2 rounded-full transition ${
                      isActive(item)
                        ? "bg-[var(--metric-primary)]"
                        : "bg-white/20 group-hover:bg-[var(--metric-primary-soft)]"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner backdrop-blur">
            <p className="text-sm font-medium text-white">Current Focus</p>
            <p className="mt-2 text-sm text-slate-400">
              Review {metricConfig.label.toLowerCase()} trends and update latest entries
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-2 w-3/4 rounded-full bg-[var(--metric-primary-soft)] transition-colors duration-500" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
