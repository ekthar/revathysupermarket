import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategoryNav } from "@/lib/categories";
import { CATEGORY_ICON_FALLBACK, categoryColorForIndex } from "@/lib/category-icons";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Categories",
  description: `Browse every grocery category available at ${SITE.name}.`,
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategoryNav();

  return (
    <main className="min-h-[100dvh] bg-background">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <h1 className="font-display text-heading font-black tracking-tight sm:text-5xl">
          All Categories
        </h1>
        <p className="mt-2 text-caption font-medium text-neutral-500 dark:text-neutral-400">
          {categories.length} {categories.length === 1 ? "category" : "categories"} to explore
        </p>

        {categories.length === 0 ? (
          <p className="mt-10 text-body text-neutral-500 dark:text-neutral-400">
            Categories are being set up. Please check back shortly.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="press group flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-white p-3 transition-all hover:border-secondary-200 hover:shadow-elevation-1 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-secondary-800 sm:p-4"
              >
                <div
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-xl",
                    categoryColorForIndex(index),
                    "dark:bg-neutral-800"
                  )}
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 150px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-4xl leading-none">
                      {category.icon || CATEGORY_ICON_FALLBACK}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-caption font-bold leading-tight text-neutral-800 dark:text-white sm:text-body">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-micro text-neutral-500 dark:text-neutral-400">
                    {category.count} {category.count === 1 ? "item" : "items"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
