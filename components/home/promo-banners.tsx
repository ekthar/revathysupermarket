"use client";

import { ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

const promos = [
  {
    id: 1,
    title: "FRESH GROCERIES FOR YOUR FAMILY, WITHOUT HASSLE.",
    subtitle: "We deliver everything you need straight to your door.",
    gradient: "from-yellow-200 via-yellow-100 to-yellow-50",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=300&fit=crop"
  },
  {
    id: 2,
    title: "FREE DELIVERY ON ORDERS OVER ₹500",
    subtitle: "Stock up on your weekly groceries and save more with zero delivery charges.",
    gradient: "from-pink-200 via-pink-100 to-pink-50",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop"
  },
  {
    id: 3,
    title: "NEW HERE? ENJOY 10% OFF YOUR FIRST ORDER",
    subtitle: "Sign up today and get instant savings on your first grocery purchase.",
    gradient: "from-emerald-200 via-emerald-100 to-emerald-50",
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=300&h=300&fit=crop"
  }
];

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

export function PromoBanners() {
  return (
    <section className="px-4 pt-4 space-y-3 md:hidden">
      {promos.map((promo, idx) => (
        <motion.div
          key={promo.id}
          custom={idx}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          whileTap={{ scale: 0.98 }}
          className={`promo-card bg-gradient-to-br ${promo.gradient} flex gap-3 press-3d`}
        >
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <h3 className="font-display text-[15px] font-black leading-tight text-slate-900">
                {promo.title}
              </h3>
              <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                {promo.subtitle}
              </p>
            </div>
          </div>
          <div className="relative w-24 h-24 shrink-0 self-center">
            <motion.img
              whileHover={{ scale: 1.08, rotate: 2 }}
              src={promo.image}
              alt=""
              className="w-full h-full object-cover rounded-2xl"
              loading="lazy"
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
