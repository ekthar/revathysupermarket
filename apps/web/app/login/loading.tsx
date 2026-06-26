export default function LoginLoading() {
  return (
    <main className="min-h-[calc(100svh-5rem)] px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-h-[420px] animate-pulse rounded-xl bg-primary/20" />
        <div className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft">
          <div className="h-12 rounded-2xl bg-muted" />
          <div className="mt-6 h-14 rounded-2xl bg-muted" />
          <div className="mt-4 h-12 rounded-2xl bg-muted" />
          <div className="mt-4 h-12 rounded-2xl bg-muted" />
          <div className="mt-5 h-14 rounded-2xl bg-primary/20" />
        </div>
      </section>
    </main>
  );
}
