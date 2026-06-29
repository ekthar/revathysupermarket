import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

const getProductSlugs = unstable_cache(
  async () =>
    prisma.product
      .findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { popularity: "desc" },
        take: 1000,
      })
      .catch(() => []),
  ["sitemap-products"],
  { revalidate: 3600, tags: ["products"] }
);

const getCategorySlugs = unstable_cache(
  async () =>
    prisma.category
      .findMany({ select: { slug: true, updatedAt: true } })
      .catch(() => []),
  ["sitemap-categories"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, categories] = await Promise.all([
    getProductSlugs(),
    getCategorySlugs(),
  ]);

  return [
    { url: SITE.url, lastModified: now, priority: 1 },
    { url: `${SITE.url}/products`, lastModified: now, priority: 0.9 },
    ...categories.map((cat) => ({
      url: `${SITE.url}/products?category=${encodeURIComponent(cat.slug)}`,
      lastModified: cat.updatedAt ?? now,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${SITE.url}/products/${product.slug}`,
      lastModified: product.updatedAt ?? now,
      priority: 0.7,
    })),
  ];
}
