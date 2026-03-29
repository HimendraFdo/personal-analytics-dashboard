type SummaryCardProps = {
    title: string;
    value: string;
};

export default function SummaryCard({title, value}: SummaryCardProps) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{value}</h3>
        </div>
    );
}