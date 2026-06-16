import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, products } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.image,
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
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-soft">
          <Image src={product.image} alt={product.name} fill priority className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
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
    </main>
  );
}
