export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="animate-pulse rounded-[2rem] bg-primary/10 p-7">
        <div className="h-4 w-28 rounded-full bg-primary/20" />
        <div className="mt-4 h-10 w-48 rounded-2xl bg-primary/20" />
        <div className="mt-4 h-5 max-w-xl rounded-full bg-primary/10" />
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-soft">
              <div className="h-11 w-11 rounded-2xl bg-muted" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-12 rounded-2xl bg-muted" />
                <div className="h-12 rounded-2xl bg-muted" />
                <div className="h-12 rounded-2xl bg-muted sm:col-span-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-[1.75rem] bg-muted shadow-soft" />
      </div>
    </main>
  );
}
