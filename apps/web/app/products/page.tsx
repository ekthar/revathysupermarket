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

type ProductFilters = {
  category?: string;
  q?: string;
  sort?: string;
  maxPrice?: number;
  limit?: number;
};

function getProducts(filters: ProductFilters = {}) {
  const { category, q, sort, maxPrice, limit = 24 } = filters;
  const cacheKey = `products:${category || "All"}:${q || ""}:${sort || "popularity"}:${maxPrice || "none"}:${limit}`;

  return unstable_cache(
    async (): Promise<{ items: Product[]; nextCursor: string | null; total: number }> => {
      // Build Prisma where clause
      const where: Record<string, unknown> = { isActive: true };
      if (category && category !== "All") {
        where.category = { name: category };
      }
      if (q) {
        where.name = { contains: q, mode: "insensitive" };
      }
      if (maxPrice) {
        where.OR = [
          { discountPrice: { not: null, lte: maxPrice } },
          { discountPrice: null, price: { lte: maxPrice } },
        ];
      }

      // Build orderBy
      let orderBy: Record<string, string>[] = [{ popularity: "desc" }, { createdAt: "desc" }];
      if (sort === "low") orderBy = [{ price: "asc" }];
      else if (sort === "high") orderBy = [{ price: "desc" }];
      else if (sort === "newest") orderBy = [{ createdAt: "desc" }];

      const [dbProducts, dbTotal] = await Promise.all([
        prisma.product.findMany({
          where,
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
            category: { select: { name: true } },
          },
          orderBy,
          take: limit + 1,
        }),
        prisma.product.count({ where }),
      ]).catch(() => [[], 0] as [never[], number]);

      if (Array.isArray(dbProducts) && dbProducts.length > 0) {
        const hasMore = dbProducts.length > limit;
        const sliced = hasMore ? dbProducts.slice(0, limit) : dbProducts;
        const items = sliced.map((product) => ({
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
          createdAt: product.createdAt.toISOString(),
        }));
        const nextCursor = hasMore ? items[items.length - 1].id : null;
        return { items, nextCursor, total: dbTotal };
      }

      // Fallback to static products
      let filtered = fallbackProducts;
      if (category && category !== "All") {
        filtered = filtered.filter((p) => p.category === category);
      }
      if (q) {
        const lower = q.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(lower));
      }
      if (maxPrice) {
        filtered = filtered.filter((p) => (p.discountPrice ?? p.price) <= maxPrice);
      }

      // Sort fallback
      if (sort === "low") filtered = [...filtered].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
      else if (sort === "high") filtered = [...filtered].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
      else if (sort === "newest") filtered = [...filtered].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
      else filtered = [...filtered].sort((a, b) => b.popularity - a.popularity);

      const fallbackTotal = filtered.length;
      const page = filtered.slice(0, limit);
      const nextCursor = page.length < filtered.length ? page[page.length - 1]?.id ?? null : null;
      return { items: page, nextCursor, total: fallbackTotal };
    },
    [cacheKey],
    { revalidate: 30, tags: ["products"] }
  )();
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}) {
  const { category, q, sort } = await searchParams;
  const { items, nextCursor, total } = await getProducts({ category, q, sort, limit: 24 });
  const initialCategory = category || "All";
  return (
    <main className="min-h-screen bg-background pb-24">
      <section className="overflow-hidden px-4 pb-1 pt-8 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-display font-black leading-none tracking-tighter sm:text-5xl">Browse</h1>
          <p className="mt-2 text-sm font-semibold text-neutral-400">{total} products available</p>
        </div>
      </section>
      <ProductGrid
        initialItems={items}
        initialTotal={total}
        initialNextCursor={nextCursor}
        initialCategory={initialCategory}
        initialQuery={q || ""}
        initialSort={(sort as "popularity" | "low" | "high" | "newest") || "popularity"}
      />
    </main>
  );
}
