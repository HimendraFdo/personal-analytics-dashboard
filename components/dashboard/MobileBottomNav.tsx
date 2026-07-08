"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getNavItemFromPath,
  MAIN_NAV_ITEMS,
  NAV_PATHS,
  type NavigationItem,
} from "@/constants/navigation";
import { parseMetricType } from "@/lib/metrics";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeItem = getNavItemFromPath(pathname);
  const activeMetric = parseMetricType(searchParams.get("metric"));

  function getHref(item: NavigationItem) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("metric", activeMetric);
    return `${NAV_PATHS[item]}?${nextParams.toString()}`;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-white/70 bg-white/90 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_32px_var(--metric-shadow)] backdrop-blur-xl transition-colors duration-500 md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = item === activeItem;

          return (
            <li key={item}>
              <Link
                aria-current={isActive ? "page" : undefined}
                href={getHref(item)}
                className={`flex min-h-12 items-center justify-center rounded-xl px-2 py-3 text-center text-xs font-semibold transition ${
                  isActive
                    ? "bg-[var(--metric-panel-strong)] text-white shadow-lg shadow-[var(--metric-shadow)]"
                    : "text-slate-600 hover:bg-[var(--metric-primary-soft)] hover:text-slate-950"
                }`}
              >
                {item}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
