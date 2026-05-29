type SummaryCardProps = {
  title: string;
  value: string;
  accent?: "primary" | "secondary" | "tertiary" | "strong";
  detail?: string;
};

const accentClasses = {
  primary:
    "from-[var(--metric-primary-soft)] to-white text-[var(--metric-primary)] ring-[var(--metric-ring)]",
  secondary:
    "from-[var(--metric-secondary-soft)] to-white text-[var(--metric-secondary)] ring-[var(--metric-ring)]",
  tertiary:
    "from-[var(--metric-tertiary-soft)] to-white text-[var(--metric-tertiary)] ring-[var(--metric-ring)]",
  strong:
    "from-[var(--metric-panel-strong)] to-[var(--metric-primary-dark)] text-white ring-white/20",
};

export default function SummaryCard({
  title,
  value,
  accent = "primary",
  detail = "Live",
}: SummaryCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-[var(--metric-shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`rounded-2xl bg-gradient-to-br p-4 ring-1 ${accentClasses[accent]}`}>
        <p className={accent === "strong" ? "text-sm font-semibold text-white/70" : "text-sm font-semibold text-slate-600"}>
          {title}
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <h3 className={accent === "strong" ? "min-w-0 break-words text-3xl font-bold text-white" : "min-w-0 break-words text-3xl font-bold text-slate-950"}>
            {value}
          </h3>
          <span className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {detail}
          </span>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full w-2/3 rounded-full bg-[var(--metric-primary)] transition-all duration-500 group-hover:w-full" />
      </div>
    </div>
  );
}
