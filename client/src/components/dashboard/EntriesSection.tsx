export default function EntriesSection() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Entries</h2>
        <p className="mt-2 text-sm text-slate-600">
          This section will let users add, edit, and review their tracked data.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Add New Entry</h3>
          <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
            Entry Form Placeholder
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Entry History</h3>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">Study Hours — 2.5 hrs</div>
            <div className="rounded-2xl bg-slate-50 p-4">Expense — $18.00</div>
            <div className="rounded-2xl bg-slate-50 p-4">Workout — 45 min</div>
          </div>
        </div>
      </section>
    </div>
  );
}