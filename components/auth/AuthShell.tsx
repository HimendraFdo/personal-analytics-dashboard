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
    <main className="min-h-screen bg-[#f6f7fb] px-3 py-3 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-6xl items-center gap-3 sm:min-h-[calc(100vh-4rem)] sm:gap-8 lg:grid-cols-[1fr_440px]">
        <section className="relative order-2 overflow-hidden rounded-3xl bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-slate-950/20 sm:px-10 sm:py-12 lg:order-1 lg:min-h-[620px] lg:rounded-[2rem]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.36),transparent_36%),linear-gradient(315deg,rgba(245,158,11,0.24),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400 text-xs font-black text-slate-950 shadow-lg shadow-teal-500/25 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-sm">
                PAD
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-200 sm:mt-8 sm:text-sm sm:tracking-[0.18em]">
                Personal Analytics Dashboard
              </p>
              <h1 className="mt-3 max-w-2xl text-xl font-black leading-tight sm:mt-4 sm:text-5xl">
                Your activity, health, finance and study data in one workspace.
              </h1>
              <p className="mt-5 hidden max-w-xl text-base leading-7 text-slate-300 sm:block">
                Sign in to continue tracking the daily inputs that shape your
                trends, summaries and recent progress.
              </p>
            </div>

            <div className="hidden gap-3 sm:grid sm:grid-cols-3">
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

        <section className="order-1 min-w-0 w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-900/10 backdrop-blur sm:p-8 lg:order-2">
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
