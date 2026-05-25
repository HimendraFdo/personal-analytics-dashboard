type PageStatusProps = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export default function PageStatus({ loading, error, onRetry }: PageStatusProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-200/80"
            >
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-8 w-16 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-1.5 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <div className="h-96 rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 xl:col-span-8">
            <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-96 rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 xl:col-span-4">
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <p className="text-sm text-red-700">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return null;
}
