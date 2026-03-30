export default function Topbar() {
    return (
        //
        <header className="flex items-center justify-between border-b border-slate-950 bg-gray-900 px-6 py-4">
            <div>
                <h1 className = "text-xl font-semibold text-slate-900">Dashboard</h1>
                <p className = "mt-1 text-sm text-slate-500">
                    Monitor your activity, trends and recent entries.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
                    Search Analytics
                </div>

                <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                    Add Entry
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    HF
                </div>
            </div>
        </header>
    );
}