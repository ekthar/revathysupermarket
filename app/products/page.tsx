import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ProductGrid } from "@/components/product-grid";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop Groceries",
  description: "Search and order fresh groceries from Revathy Supermarket in Neyyattinkara."
};

const getProducts = unstable_cache(async (): Promise<Product[]> => {
  const dbProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      image: true,
      price: true,
      discountPrice: true,
      stock: true,
      popularity: true,
      unit: true,
      category: { select: { name: true } }
    },
    orderBy: [{ popularity: "desc" }, { createdAt: "desc" }]
  }).catch(() => []);

  if (dbProducts.length === 0) return fallbackProducts;

  return dbProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category.name as Product["category"],
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
    image: product.image,
    description: product.description,
    stock: product.stock,
    popularity: product.popularity,
    unit: product.unit
  }));
}, ["public-products"], { revalidate: 30, tags: ["products"] });

export default async function ProductsPage() {
  const products = await getProducts();
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
      <ProductGrid items={products} />
    </main>
  );
}
