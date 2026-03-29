export default function Sidebar() {
    const navItems = ["Dashboard", "Entries","Analytics","Settings"];

    return(
        <aside className="hidden x-64 flex-col bg-slate-900 text-white md:flex">
            <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="text-xl font-bold">PAD</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Personal Analytics
                </p>
            </div>

            <nav className="flex-1 px-4 py-6">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item}>
                            <button
                            className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                            type="button"
                            >
                              {item}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}