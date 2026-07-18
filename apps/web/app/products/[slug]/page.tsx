import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductCard } from "@/components/product-card";
import { ProductReviews } from "@/components/product-reviews";
import { ProductSuggestions } from "@/components/product-suggestions";
import { StructuredData } from "@/components/structured-data";
import { productSchema, breadcrumbSchema } from "@/lib/structured-data";
import { getProductBySlug, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/types";
import { safeProductImageUrl } from "@/lib/image";
import { SITE } from "@/lib/constants";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

async function getProduct(slug: string): Promise<Product | undefined> {
  const staticProduct = getProductBySlug(slug);
  if (staticProduct) return staticProduct;

  const dbProduct = await prisma.product.findUnique({
    where: { slug },
    include: { category: true }
  }).catch(() => null);
  if (!dbProduct) return undefined;

  return {
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
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, description: product.description, images: [safeProductImageUrl(product.image)] }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 6);

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

      <ProductDetailClient product={product} />

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
        <section className="max-w-7xl mx-auto px-4 pb-28 pt-8 md:px-6 lg:px-8">
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">You might also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}
