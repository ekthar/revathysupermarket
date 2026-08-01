import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductCard } from "@/components/product-card";
import { ProductReviews } from "@/components/product-reviews";
import { ProductSuggestions } from "@/components/product-suggestions";
import { StructuredData } from "@/components/structured-data";
import { productSchema, breadcrumbSchema } from "@/lib/structured-data";
import { getProductBySlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/types";
import type { ProductVariantItem } from "@/components/product/variant-selector";
import { safeProductImageUrl } from "@/lib/image";
import { SITE } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/feature-flags";

const useDemoData = process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true";

async function getProduct(slug: string): Promise<{ product: Product; variants: ProductVariantItem[] } | undefined> {
  // Database lookup is primary
  const dbProduct = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, variants: { orderBy: { sortOrder: "asc" } } }
  }).catch(() => null);

  if (dbProduct) {
    const product: Product = {
      id: dbProduct.id,
      slug: dbProduct.slug,
      name: dbProduct.name,
      category: dbProduct.category.name as Product["category"],
      price: Number(dbProduct.price),
      discountPrice: dbProduct.discountPrice ? Number(dbProduct.discountPrice) : undefined,
      image: dbProduct.image,
      description: dbProduct.description,
      stock: dbProduct.stock,
      popularity: dbProduct.popularity,
      unit: dbProduct.unit,
      isFeatured: dbProduct.isFeatured,
      createdAt: dbProduct.createdAt.toISOString()
    };
    const variants: ProductVariantItem[] = dbProduct.variants.map((v) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
      discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
      stock: v.stock,
      unit: v.unit,
    }));
    return { product, variants };
  }

  // Fall back to demo data only when explicitly enabled
  if (useDemoData) {
    const staticProduct = getProductBySlug(slug);
    if (staticProduct) return { product: staticProduct, variants: [] };
  }

  return undefined;
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  // Try to get related products from DB (same category, exclude self, active only)
  const dbRelated = await prisma.product.findMany({
    where: {
      category: { name: product.category },
      id: { not: product.id },
      isActive: true,
    },
    take: 6,
    orderBy: { popularity: "desc" },
    include: { category: true },
  }).catch(() => []);

  if (dbRelated.length > 0) {
    return dbRelated.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category.name as Product["category"],
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
      image: p.image,
      description: p.description,
      stock: p.stock,
      popularity: p.popularity,
      unit: p.unit,
      isFeatured: p.isFeatured,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  // Fall back to demo data only when explicitly enabled
  if (useDemoData) {
    const { products } = await import("@/lib/products");
    return products
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 6);
  }

  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProduct(slug);
  if (!result) return {};
  const { product } = result;
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, description: product.description, images: [safeProductImageUrl(product.image)] }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getProduct(slug);
  if (!result) notFound();
  const { product, variants } = result;
  const related = await getRelatedProducts(product);
  const variantsEnabled = await isFeatureEnabled("product_variants");

  return (
    <main className="min-h-[100dvh] bg-background">
      <StructuredData
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: "Home", url: SITE.url },
            { name: "Products", url: `${SITE.url}/products` },
            { name: product.name, url: `${SITE.url}/products/${product.slug}` },
          ]),
        ]}
      />

      <ProductDetailClient
        product={product}
        variants={variantsEnabled ? variants : []}
      />

      {/* Product Suggestions (Frequently Bought Together) */}
      <ProductSuggestions productSlug={slug} />

      {/* Product Reviews */}
      <ProductReviews
        productSlug={slug}
        initialAvgRating={product.avgRating}
        initialReviewCount={product.reviewCount}
      />

      {/* Related products */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8 pt-8 md:px-6 lg:px-8">
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">You might also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
