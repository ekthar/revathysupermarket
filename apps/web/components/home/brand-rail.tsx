import Link from "next/link";

export function BrandRail({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="pt-6 pb-2" aria-label="Shop by brand">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Shop by Brand
        </h2>
        <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/products?brand=${encodeURIComponent(brand)}`}
              className="flex-shrink-0 snap-start h-10 px-5 rounded-full border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap flex items-center"
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
