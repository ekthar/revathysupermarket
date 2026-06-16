import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-grid";

export const metadata: Metadata = {
  title: "Shop Groceries",
  description: "Search and order fresh groceries from Revathy Supermarket in Neyyattinkara."
};

export default function ProductsPage() {
  return (
    <main>
      <section className="overflow-hidden bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.14))] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">Fresh today</span>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">Shop groceries</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Live search, category filtering, price filtering, and delivery-ready products from Revathy Supermarket.
          </p>
        </div>
      </section>
      <ProductGrid />
    </main>
  );
}
