"use client";

import Link from "next/link";
import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CreditCard, LocateFixed, ReceiptText, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function MotionCategoryCard({ href, category, accent }: { href: string; category: string; accent: string }) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} whileHover={{ y: -4 }} className="min-w-[154px] snap-start sm:min-w-0">
      <Link
        href={href}
        className="block h-full rounded-xl border border-white/70 bg-card/90 p-4 shadow-soft transition hover:border-primary/40 dark:border-white/10 sm:p-5"
      >
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-black ring-8", accent)}>
          {category.slice(0, 2)}
        </span>
        <h3 className="mt-4 text-sm font-black sm:text-base">{category}</h3>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Fresh stock daily</p>
      </Link>
    </motion.div>
  );
}

const howItWorksIcons = {
  shopping: ShoppingBag,
  location: LocateFixed,
  payment: CreditCard,
  receipt: ReceiptText
};

export function HowItWorksCard({
  icon,
  title,
  text,
  index
}: {
  icon: keyof typeof howItWorksIcons;
  title: string;
  text: string;
  index: number;
}) {
  const Icon = howItWorksIcons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-xl border border-white/70 bg-card/90 p-5 shadow-soft dark:border-white/10"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary-100">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <p className="font-black">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
    </motion.div>
  );
}
