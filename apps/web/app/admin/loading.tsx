export default function AdminLoading() {
  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[250px_1fr] lg:px-8">
      <aside className="h-72 animate-pulse rounded-xl bg-muted shadow-soft" />
      <section className="grid gap-4">
        <div className="h-40 animate-pulse rounded-xl bg-primary/10" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-xl bg-muted shadow-soft" />
          ))}
        </div>
      </section>
    </main>
  );
}
