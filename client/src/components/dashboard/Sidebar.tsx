type SidebarProps = {
    activeItem: string;
    onSelectItem: (item: string) => void;
};

export default function Sidebar({
    activeItem,
    onSelectItem,
}: SidebarProps) {
    const mainNavItems = ["Dashboard", "Entries", "Trends", "Analytics"];

    const secondaryNavItems = ["Goals", "Settings", "Help"];

    return(
        <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-white md:flex">
            <div className="border-b border-slate-800 px-6 py-6">
                <h2 className="text-xl font-bold" tracking-tight>PAD</h2>
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
                        {mainNavItems.map((item) => (
                            <li key={item}>
                                <button
                                    type="button"
                                    onClick={() => onSelectItem(item)}
                                    className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-slate-800 ${
                                        activeItem == item
                                            ? "bg-slate-700 text-white"
                                            : "text-slate-400 hover:bg-slate-800"
                                    }`}
                                >
                                    {item}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Workspace
                    </p>

                    <ul className="mt-3 space-y-1">
                        {secondaryNavItems.map((item) => (
                            <li key={item}>
                                <button
                                type="button"
                                onClick={() => onSelectItem(item)}
                                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition ${
                                    activeItem === item
                                        ? "bg-slate-800 text-white"
                                        : "hover:bg-slate-900 hover:text-white"
                                    }`}
                                >
                                    {item}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-slate-800 pc-4 py-4">
                    <div className="rounded-2xl bg-slate-900 p-4">
                        <p className="text-sm font-medium text-white">Current Focus</p>
                        <p className="mt-2 text-sm text-slate-400">
                            Review weekly trends and update your latest entries
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    )
}