type ChartSkeletonProps = {
  label?: string;
};

export default function ChartSkeleton({ label = "Loading chart" }: ChartSkeletonProps) {
  return (
    <div className="flex h-full min-h-56 flex-col justify-end rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:min-h-64 sm:p-4">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--metric-primary-soft)]" />
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <div className="flex h-44 items-end gap-2 sm:h-48 sm:gap-3">
        {[42, 68, 52, 84, 60, 76, 48, 90].map((height, index) => (
          <div
            key={`${height}-${index}`}
            className="flex-1 animate-pulse rounded-t-xl bg-[var(--metric-primary-soft)]"
            style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
