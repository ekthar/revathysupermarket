import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, products } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/types";
import { safeProductImageUrl } from "@/lib/image";
import { ProductImage } from "@/components/product-image";
import { ProductRecentlyViewed } from "@/components/product-recently-viewed";

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
    openGraph: {
      title: product.name,
      description: product.description,
      images: [safeProductImageUrl(product.image)]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: safeProductImageUrl(product.image),
            description: product.description,
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: product.discountPrice ?? product.price,
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })
        }}
      />
      <section className="grid gap-0 overflow-hidden rounded-[2rem] bg-card/95 shadow-soft lg:grid-cols-2">
        <div className="relative aspect-[1.05] overflow-hidden bg-muted lg:aspect-square">
          <ProductImage src={product.image} alt={product.name} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/55 to-transparent" />
        </div>
        <div className="-mt-8 flex flex-col justify-center rounded-t-[2rem] bg-card/95 p-5 backdrop-blur lg:mt-0 lg:rounded-none lg:p-8">
          <Badge>{product.category}</Badge>
          <h1 className="mt-4 font-display text-4xl font-black">{product.name}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{product.description}</p>
          <div className="mt-6">
            <span className="text-4xl font-black">{formatCurrency(product.discountPrice ?? product.price)}</span>
            {product.discountPrice && (
              <span className="ml-3 text-lg text-muted-foreground line-through">{formatCurrency(product.price)}</span>
            )}
          </div>
          <p className="mt-2 text-sm font-bold text-primary">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
          <ProductDetailActions product={product} />
        </div>
      </section>
      <section className="mt-16">
        <h2 className="font-display text-3xl font-black">Related products</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {related.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>
      <ProductRecentlyViewed product={product} />
    </main>
  );
}
