"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
};

export function PromoBanners({ banners }: { banners?: Banner[] }) {
  if (!banners || banners.length === 0) return null;

  return <BannerCarousel banners={banners} />;
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const touchResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track selected slide index
  const onSelect = useCallback(() => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    setSlideCount(api.scrollSnapList().length);
    setSelectedIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  // Auto-advance with pause on hover/touch and reduced motion respect
  useEffect(() => {
    if (!api) return;

    // Respect prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;
    }

    if (isHovered || isTouched) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api, isHovered, isTouched]);

  const handleTouchStart = useCallback(() => {
    if (touchResumeTimer.current) {
      clearTimeout(touchResumeTimer.current);
      touchResumeTimer.current = null;
    }
    setIsTouched(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Resume auto-advance after a short delay
    touchResumeTimer.current = setTimeout(() => {
      setIsTouched(false);
    }, 3000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (touchResumeTimer.current) {
        clearTimeout(touchResumeTimer.current);
      }
    };
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  return (
    <section className="px-4 pt-4">
      <div
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Carousel
          opts={{ loop: true, align: "start" }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {banners.map((banner) => (
              <CarouselItem
                key={banner.id}
                className="basis-[92%] md:basis-full pl-2 md:pl-4"
              >
                <BannerCard banner={banner} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation arrows - desktop only, visible on hover */}
          <CarouselPrevious className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity" />
          <CarouselNext className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>
      </div>

      {/* Dot indicators */}
      {slideCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "w-6 h-2 bg-secondary-500"
                  : "w-2 h-2 bg-neutral-300 dark:bg-neutral-600"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const content = (
    <div className="relative overflow-hidden rounded-2xl aspect-[16/7] md:aspect-[3/1]">
      {/* Background image */}
      <Image
        src={banner.image}
        alt={banner.title || "Promotional banner"}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Offer badge - top left */}
      <div className="absolute top-3 left-3 bg-secondary-500 text-white text-xs font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
        <Tag className="h-3 w-3" />
        Offer
      </div>

      {/* Content - bottom left */}
      <div className="absolute bottom-3 left-3 right-14 md:right-24">
        <h3 className="font-display text-xl md:text-2xl font-black text-white leading-tight tracking-[-0.03em]">
          {banner.title}
        </h3>
        {banner.subtitle && (
          <p className="text-sm text-white/80 mt-1 line-clamp-2">
            {banner.subtitle}
          </p>
        )}
      </div>

      {/* Shop Now link - bottom right */}
      {banner.href && (
        <span className="absolute bottom-3 right-3 text-sm font-bold text-white/90 hover:text-white flex items-center gap-1">
          Shop Now
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );

  if (banner.href) {
    return (
      <Link href={banner.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
