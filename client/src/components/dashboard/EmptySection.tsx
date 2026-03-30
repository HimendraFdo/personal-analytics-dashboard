type EmptySectionProps = {
  title: string;
};

export default function EmptySection({ title }: EmptySectionProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        This section does not have content yet.
      </p>
    </div>
  );
}