type PageStatusProps = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export default function PageStatus({ loading, error, onRetry }: PageStatusProps) {
  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
        Loading entries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <p className="text-sm text-red-700">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return null;
}
