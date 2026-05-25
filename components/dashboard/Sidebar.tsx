"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MAIN_NAV_ITEMS,
  NAV_PATHS,
  type NavigationItem,
} from "@/constants/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(item: NavigationItem) {
    return pathname === NAV_PATHS[item];
  }

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-900/70 bg-slate-950 text-white md:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20">
            PAD
          </div>
          <div>
            <h2 className="text-xl font-bold">PAD</h2>
            <p className="text-xs font-medium text-teal-200">Live workspace</p>
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
                  href={NAV_PATHS[item]}
                  className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive(item)
                      ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span>{item}</span>
                  <span
                    className={`h-2 w-2 rounded-full transition ${
                      isActive(item) ? "bg-teal-500" : "bg-slate-700 group-hover:bg-teal-300"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-inner">
            <p className="text-sm font-medium text-white">Current Focus</p>
            <p className="mt-2 text-sm text-slate-400">
              Review weekly trends and update your latest entries
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div className="h-2 w-3/4 rounded-full bg-teal-400" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
