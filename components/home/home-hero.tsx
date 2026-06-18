"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type HomeHeroProps = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  deliveryRadiusKm: number;
  gstEnabled: boolean;
};

export function HomeHero({ title, href, image, deliveryRadiusKm }: HomeHeroProps) {
  return (
    <section className="mx-4 mt-3 overflow-hidden rounded-xl">
      <Link href={href} className="relative block aspect-[2/1] sm:aspect-[3/1]">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs font-medium text-white/80">{deliveryRadiusKm} KM delivery radius</p>
          <h2 className="mt-1 text-lg font-bold text-white leading-tight">{title}</h2>
          <span className="mt-2 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            Shop now <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </section>
  );
}
