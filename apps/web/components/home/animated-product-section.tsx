"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

interface AnimatedProductSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: Product[];
  showCategoryPills?: boolean;
  categoryPills?: string[];
  categories?: readonly string[];
  layout?: "scroll" | "grid" | "mixed";
  desktopOnly?: boolean;
  hideHeader?: boolean;
}

export function AnimatedProductSection({
  title,
  subtitle,
  icon,
  products,
  showCategoryPills = false,
  categoryPills = [],
  categories = [],
  layout = "scroll",
  desktopOnly = false,
  hideHeader = false
}: AnimatedProductSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const ctx = gsap.context(() => {
        // Fade in header
        if (headerRef.current) {
          gsap.from(headerRef.current, {
            opacity: 0,
            y: 12,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
              once: true
            }
          });
        }

        // Stagger items in scroll track (mobile horizontal)
        if (scrollTrackRef.current) {
          const items = scrollTrackRef.current.querySelectorAll<HTMLElement>(".product-scroll-item");
          if (items.length > 0) {
            gsap.from(items, {
              opacity: 0,
              y: 12,
              duration: 0.35,
              stagger: 0.03,
              ease: "power2.out",
              scrollTrigger: {
                trigger: scrollTrackRef.current,
                start: "top 90%",
                toggleActions: "play none none none",
                once: true
              }
            });
          }
        }

        // Stagger grid items
        if (gridRef.current) {
          const items = gridRef.current.querySelectorAll<HTMLElement>(".product-grid-item");
          if (items.length > 0) {
            gsap.from(items, {
              opacity: 0,
              y: 16,
              duration: 0.4,
              stagger: 0.04,
              ease: "power2.out",
              scrollTrigger: {
                trigger: gridRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
                once: true
              }
            });
          }
        }
      }, sectionRef.current!);

      return () => ctx.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className={`pt-8 md:pt-12 overflow-hidden ${desktopOnly ? "hidden md:block" : ""}`}
    >
      {!hideHeader && (
        <div ref={headerRef} className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="section-title text-lg md:text-2xl">{title}</h2>
            </div>
            <Link href="/products" className="show-all-pill text-xs md:text-sm">
              Show All
              <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Link>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs md:text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
      )}

      {/* Category filter pills */}
      {showCategoryPills && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categoryPills.map((label, idx) => (
              <div key={label} className="shrink-0">
                <Link
                  href={`/products?category=${encodeURIComponent(categories[idx] || label)}`}
                  className={`block whitespace-nowrap px-4 py-2 rounded-full text-caption font-semibold transition-all ${
                    idx === 0
                      ? "bg-primary text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scroll layout (mobile horizontal) */}
      {(layout === "scroll" || layout === "mixed") && (
        <div className={`mt-4 pb-2 ${layout === "mixed" ? "md:hidden" : ""}`}>
          <div ref={scrollTrackRef} className="wheel-scroll px-4 md:px-6 lg:px-8">
            {products.map((p) => (
              <div
                key={p.id}
                className="product-scroll-item wheel-scroll-item w-[clamp(140px,42vw,155px)] sm:w-[170px] md:w-[200px]"
              >
                <ProductCard product={p} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid layout (desktop) */}
      {(layout === "grid" || layout === "mixed") && (
        <div className={`max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4 ${layout === "mixed" ? "hidden md:block" : ""}`}>
          <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map((p) => (
              <div key={p.id} className="product-grid-item">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
