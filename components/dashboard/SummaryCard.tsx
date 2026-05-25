type SummaryCardProps = {
  title: string;
  value: string;
  accent?: "teal" | "blue" | "amber" | "rose";
  detail?: string;
};

const accentClasses = {
  teal: "from-teal-500/16 to-emerald-500/8 text-teal-700 ring-teal-200",
  blue: "from-blue-500/16 to-indigo-500/8 text-blue-700 ring-blue-200",
  amber: "from-amber-500/18 to-orange-500/8 text-amber-700 ring-amber-200",
  rose: "from-rose-500/16 to-pink-500/8 text-rose-700 ring-rose-200",
};

export default function SummaryCard({
  title,
  value,
  accent = "teal",
  detail = "Live",
}: SummaryCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200">
      <div className={`rounded-2xl bg-gradient-to-br p-4 ring-1 ${accentClasses[accent]}`}>
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <h3 className="text-3xl font-bold text-slate-950">{value}</h3>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold shadow-sm">
            {detail}
          </span>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full w-2/3 rounded-full bg-slate-900 transition-all duration-500 group-hover:w-full" />
      </div>
    </div>
  );
}
