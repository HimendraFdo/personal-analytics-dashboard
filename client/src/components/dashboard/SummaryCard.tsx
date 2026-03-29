type SummaryCardProps = {
    title: string;
    value: string;
};

export default function SummaryCard({title, value}: SummaryCardProps) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="mt-4 flex items-end justify-between">
                <h3 className="mt-3 text-2xl font-bold text-slate-900">{value}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    Live
                </span>
            </div>
        </div>
    );
}