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
    <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-white md:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <h2 className="text-xl font-bold tracking-tight">PAD</h2>
        <p className="mt-1 text-sm text-slate-400">
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
                  className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-800 ${
                    isActive(item)
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-sm font-medium text-white">Current Focus</p>
            <p className="mt-2 text-sm text-slate-400">
              Review weekly trends and update your latest entries
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
