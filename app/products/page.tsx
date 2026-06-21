import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ProductGrid } from "@/components/product-grid";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shop Groceries",
  description: `Search and order fresh groceries from ${SITE.name}.`
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
      isFeatured: true,
      createdAt: true,
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
    unit: product.unit,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.toISOString()
  }));
}, ["public-products"], { revalidate: 30, tags: ["products"] });

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const products = await getProducts();
  const initialCategory = category && ["All", ...new Set(products.map((product) => product.category))].includes(category) ? category : "All";
  return (
    <main className="min-h-screen bg-background pb-24">
      <section className="overflow-hidden px-4 pb-1 pt-8 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-[2rem] font-black leading-none tracking-[-0.06em] sm:text-5xl">Browse</h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">{products.length} products available</p>
        </div>
      </section>
      <ProductGrid items={products} initialCategory={initialCategory} initialQuery={q || ""} />
    </main>
  );
}
