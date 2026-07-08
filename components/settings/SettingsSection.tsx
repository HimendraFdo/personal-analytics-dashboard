"use client";

import CategorySettings from "./CategorySettings";

export default function SettingsSection() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6">
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          Settings
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Customise how your dashboard works.
        </p>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add, rename, or remove the categories you can assign to entries.
          </p>
        </div>
        <CategorySettings />
      </section>
    </div>
  );
}
