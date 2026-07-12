"use client";

import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/gsap/scroll-reveal";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
};

export function PromoBanners({ banners }: { banners?: Banner[] }) {
  if (!banners || banners.length === 0) return null;

  return (
    <ScrollReveal y={16} stagger={0.08} amount={0.2}>
      <section className="px-4 pt-4 space-y-3">
        {banners.map((banner) => {
          const Wrapper = banner.href ? Link : "div";
          const wrapperProps = banner.href ? { href: banner.href } : {};

          return (
            <ScrollRevealItem key={banner.id}>
              <Wrapper
                {...(wrapperProps as any)}
                className="promo-card card-green-glass flex gap-3 press"
              >
                <div className="absolute top-0 left-0 z-10">
                  <div className="bg-secondary-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-br-lg flex items-center gap-1 shadow-lg">
                    <Tag className="h-3 w-3" /> Offer
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="pt-5">
                    <h3 className="font-display text-title font-black leading-tight text-neutral-900 dark:text-white">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="mt-2 text-caption text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {banner.image && (
                  <div className="relative w-24 h-24 shrink-0 self-center">
                    <Image
                      src={banner.image}
                      alt={banner.title || "Promotional banner"}
                      fill
                      sizes="96px"
                      className="rounded-2xl object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </Wrapper>
            </ScrollRevealItem>
          );
        })}
      </section>
    </ScrollReveal>
  );
}
