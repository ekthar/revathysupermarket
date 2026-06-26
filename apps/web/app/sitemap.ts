import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, priority: 1 },
    { url: `${SITE.url}/products`, lastModified: now, priority: 0.9 },
    { url: `${SITE.url}/cart`, lastModified: now, priority: 0.5 },
    ...products.map((product) => ({
      url: `${SITE.url}/products/${product.slug}`,
      lastModified: now,
      priority: 0.75
    }))
  ];
}
