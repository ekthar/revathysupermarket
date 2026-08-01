import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CategoryRail } from "@/components/category/category-rail";
import { ProductCard } from "@/components/product-card";
import { EmptySearchState } from "@/components/ui/empty-states";
import { getCategoryNav, getCategoryPageData } from "@/lib/categories";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) return { title: "Category not found" };

  const description =
    data.category.description ||
    `Shop ${data.total} ${data.category.name.toLowerCase()} products from ${SITE.name}. Fresh stock, fast delivery.`;

  return {
    title: data.category.name,
    description,
    alternates: { canonical: `/category/${data.category.slug}` },
    openGraph: { title: data.category.name, description },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, { sub }] = await Promise.all([params, searchParams]);

  const [nav, data] = await Promise.all([
    getCategoryNav(),
    getCategoryPageData(slug, sub),
  ]);

  if (!data) notFound();

  const { category, subCategories, products, total } = data;
  const activeSub = sub ? subCategories.find((s) => s.slug === sub) : undefined;

  return (
    <main className="min-h-[100dvh] bg-background">
      {/* Two-pane browse: persistent L1 rail + L2/product pane */}
      <div className="mx-auto flex max-w-7xl items-start">
        <CategoryRail items={nav} activeSlug={category.slug} />

        <section className="min-w-0 flex-1 px-3 pb-10 pt-4 sm:px-5 lg:px-6">
          <header>
            {/* Breadcrumb trail — the global Breadcrumbs component can't know
                about the optional L2 selection. */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-caption text-neutral-500 dark:text-neutral-400">
              <Link href="/categories" className="hover:text-foreground">
                Categories
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              {activeSub ? (
                <>
                  <Link href={`/category/${category.slug}`} className="hover:text-foreground">
                    {category.name}
                  </Link>
                  <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-foreground">{activeSub.name}</span>
                </>
              ) : (
                <span className="font-semibold text-foreground">{category.name}</span>
              )}
            </nav>

            <h1 className="mt-1.5 font-display text-heading font-black tracking-tight sm:text-4xl">
              {activeSub ? activeSub.name : category.name}
            </h1>
            <p className="mt-1 text-caption font-semibold text-neutral-500 dark:text-neutral-400">
              {total} {total === 1 ? "product" : "products"}
            </p>
          </header>

          {/* L2 subcategory chips */}
          {subCategories.length > 0 && (
            <div className="mt-3 -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                <Link
                  href={`/category/${category.slug}`}
                  aria-current={!activeSub ? "page" : undefined}
                  className={cn(
                    "press h-9 shrink-0 snap-start rounded-full px-4 text-caption font-bold leading-9 transition-colors",
                    !activeSub
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border border-border bg-card text-muted-foreground"
                  )}
                >
                  All
                </Link>
                {subCategories.map((subCategory) => {
                  const isActive = activeSub?.slug === subCategory.slug;
                  return (
                    <Link
                      key={subCategory.id}
                      href={`/category/${category.slug}?sub=${encodeURIComponent(subCategory.slug)}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "press h-9 shrink-0 snap-start rounded-full px-4 text-caption font-bold leading-9 transition-colors",
                        isActive
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          : "border border-border bg-card text-muted-foreground"
                      )}
                    >
                      {subCategory.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product grid */}
          {products.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptySearchState />
              <div className="mt-4 flex justify-center">
                <Link
                  href="/products"
                  className="press inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-caption font-bold text-white dark:bg-white dark:text-neutral-900"
                >
                  Browse all products
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
