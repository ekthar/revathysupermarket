"use client";

import { motion } from "framer-motion";
import { Package, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { springs } from "@/lib/motion";

// Empty cart illustration
export function EmptyCartState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={springs.enter}
        className="relative"
      >
        <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        </div>
        {/* Decorative dots */}
        <motion.span aria-hidden="true" animate={{ y: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/30" />
        <motion.span aria-hidden="true" animate={{ y: [2, -2, 2] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute -bottom-1 -left-2 h-2 w-2 rounded-full bg-orange-300" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-xl font-black text-slate-900 dark:text-white"
      >
        Your cart is empty
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs"
      >
        Looks like you haven&apos;t added anything yet. Start shopping to fill it up!
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Link href="/products" className="mt-6 inline-flex h-12 px-8 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold press shadow-lg">
          Browse Products
        </Link>
      </motion.div>
    </div>
  );
}

// Empty orders illustration
export function EmptyOrdersState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.enter}
        className="relative"
      >
        <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <Package className="h-9 w-9 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        </div>
        <motion.span aria-hidden="true" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 right-0 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-primary" />
        </motion.span>
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
        No orders yet
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-1.5 text-body text-slate-500 dark:text-slate-400 max-w-xs">
        Your order history will appear here once you place your first order.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Link href="/products" className="mt-5 inline-flex h-10 px-6 items-center justify-center rounded-full bg-primary text-white text-body font-bold press">
          Start Shopping
        </Link>
      </motion.div>
    </div>
  );
}

// No search results
export function EmptySearchState({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: 10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={springs.enter}
        className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center"
      >
        <Search className="h-9 w-9 text-slate-300 dark:text-slate-600" aria-hidden="true" />
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
        No results found
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-1.5 text-body text-slate-500 dark:text-slate-400 max-w-xs">
        {query ? `We couldn't find anything for "${query}". Try a different search or browse categories.` : "Try a different search term or browse our categories."}
      </motion.p>
    </div>
  );
}
