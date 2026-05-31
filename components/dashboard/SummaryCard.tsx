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
    <div className="group overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm shadow-[var(--metric-shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5">
      <div className={`rounded-2xl bg-gradient-to-br p-3 ring-1 sm:p-4 ${accentClasses[accent]}`}>
        <p className={accent === "strong" ? "text-sm font-semibold text-white/70" : "text-sm font-semibold text-slate-600"}>
          {title}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-2 sm:mt-4 sm:gap-4">
          <h3 className={accent === "strong" ? "min-w-0 max-w-full break-all text-2xl font-bold text-white sm:break-words sm:text-3xl" : "min-w-0 max-w-full break-all text-2xl font-bold text-slate-950 sm:break-words sm:text-3xl"}>
            {value}
          </h3>
          <span className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {detail}
          </span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-4">
        <span className="block h-full w-2/3 rounded-full bg-[var(--metric-primary)] transition-all duration-500 group-hover:w-full" />
      </div>
    </div>
  );
}
