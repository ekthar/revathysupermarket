"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: i * 0.12
    }
  })
};

const gradients = [
  "from-yellow-200 via-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:via-slate-900 dark:to-slate-900",
  "from-pink-200 via-pink-100 to-pink-50 dark:from-pink-900/30 dark:via-slate-900 dark:to-slate-900",
  "from-emerald-200 via-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:via-slate-900 dark:to-slate-900",
  "from-blue-200 via-blue-100 to-blue-50 dark:from-blue-900/30 dark:via-slate-900 dark:to-slate-900",
  "from-orange-200 via-orange-100 to-orange-50 dark:from-orange-900/30 dark:via-slate-900 dark:to-slate-900"
];

export function PromoBanners({ banners }: { banners?: Banner[] }) {
  // If no banners from DB, show nothing (no more hardcoded content)
  if (!banners || banners.length === 0) return null;

  return (
    <section className="px-4 pt-4 space-y-3 md:hidden">
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
              className={`promo-card bg-gradient-to-br ${gradients[idx % gradients.length]} flex gap-3 press-3d block`}
            >
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-display text-[15px] font-black leading-tight text-slate-900 dark:text-white">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
              {banner.image && (
                <div className="relative w-24 h-24 shrink-0 self-center">
                  <img
                    src={banner.image}
                    alt=""
                    className="w-full h-full object-cover rounded-2xl"
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
