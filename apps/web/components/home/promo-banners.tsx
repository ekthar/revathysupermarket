"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Tag, Clock, Sparkles } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
};

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
      delay: i * 0.08
    }
  })
};

const gradients = [
  "from-yellow-200 via-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:via-neutral-900 dark:to-neutral-900",
  "from-pink-200 via-pink-100 to-pink-50 dark:from-pink-900/30 dark:via-neutral-900 dark:to-neutral-900",
  "from-secondary-200 via-secondary-100 to-secondary-50 dark:from-secondary-900/30 dark:via-neutral-900 dark:to-neutral-900",
  "from-blue-200 via-blue-100 to-blue-50 dark:from-blue-900/30 dark:via-neutral-900 dark:to-neutral-900",
  "from-orange-200 via-orange-100 to-orange-50 dark:from-orange-900/30 dark:via-neutral-900 dark:to-neutral-900"
];

export function PromoBanners({ banners }: { banners?: Banner[] }) {
  // If no banners from DB, show nothing (no more hardcoded content)
  if (!banners || banners.length === 0) return null;

  return (
    <section className="px-4 pt-4 space-y-3">
      {banners.map((banner, idx) => {
        const Wrapper = banner.href ? Link : "div";
        const wrapperProps = banner.href ? { href: banner.href } : {};

        return (
          <motion.div
            key={banner.id}
            custom={idx}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            whileTap={{ scale: 0.98 }}
          >
              <Wrapper
                {...(wrapperProps as any)}
                className={`promo-card bg-gradient-to-br ${gradients[idx % gradients.length]} flex gap-3 press-3d block relative overflow-hidden`}
              >
                {/* Offer chip */}
                {idx === 0 && (
                  <div className="absolute top-0 left-0 z-10">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-br-lg flex items-center gap-1 shadow-lg">
                      <Sparkles className="h-3 w-3" /> Limited
                    </div>
                  </div>
                )}
                {idx === 1 && (
                  <div className="absolute top-0 left-0 z-10">
                    <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-br-lg flex items-center gap-1 shadow-lg">
                      <Tag className="h-3 w-3" /> Sale
                    </div>
                  </div>
                )}
                {idx > 1 && (
                  <div className="absolute top-0 left-0 z-10">
                    <div className="bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-br-lg flex items-center gap-1 shadow-lg">
                      <Clock className="h-3 w-3" /> New
                    </div>
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className={idx < 2 ? "pt-5" : ""}>
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
          </motion.div>
        );
      })}
    </section>
  );
}
