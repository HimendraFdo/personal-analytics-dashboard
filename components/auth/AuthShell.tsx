type AuthShellProps = {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export default function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20 sm:px-10 sm:py-12 lg:min-h-[620px]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.36),transparent_36%),linear-gradient(315deg,rgba(245,158,11,0.24),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-400 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/25">
                PA
              </div>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
                Personal Analytics Dashboard
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                Your activity, health, finance and study data in one workspace.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                Sign in to continue tracking the daily inputs that shape your
                trends, summaries and recent progress.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {["Study", "Finance", "Health"].map((label) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                  key={label}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Focus
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/10 backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {description}
          </p>

          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
