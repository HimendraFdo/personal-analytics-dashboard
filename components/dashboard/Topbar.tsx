"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemFromPath, NAV_PATHS, NAVIGATION_ITEMS } from "@/constants/navigation";

export default function Topbar() {
  const pathname = usePathname();
  const activeItem = getNavItemFromPath(pathname);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{activeItem}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your activity, trends and recent entries.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
          Search Analytics
        </div>

        <Link
          href={NAV_PATHS[NAVIGATION_ITEMS.ENTRIES]}
          className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Add Entry
        </Link>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          HF
        </div>
      </div>
    </header>
  );
}
