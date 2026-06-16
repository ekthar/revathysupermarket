"use client";

import Link from "next/link";
import { ArrowRight, Bike, Clock, CreditCard, ReceiptText, Search, ShoppingBasket, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HomeHeroProps = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  deliveryRadiusKm: number;
  gstEnabled: boolean;
};

const floatingCards = [
  { name: "Fresh banana", price: "₹64/kg", className: "left-4 top-24 rotate-[-5deg] sm:left-auto sm:right-16 sm:top-28", delay: 0 },
  { name: "Matta rice", price: "₹295", className: "right-4 top-56 rotate-[4deg] sm:right-36 sm:top-72", delay: 0.12 },
  { name: "Milk & dairy", price: "Daily stock", className: "bottom-32 left-5 rotate-[3deg] sm:left-auto sm:right-8 sm:bottom-40", delay: 0.24 }
];

export function HomeHero({ title, subtitle, href, image, deliveryRadiusKm, gstEnabled }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();
  const float = reduceMotion ? {} : { y: [0, -10, 0], rotate: [-1, 1, -1] };

  return (
    <section className="relative isolate overflow-hidden rounded-b-[2.5rem] bg-slate-950 sm:rounded-b-[4rem]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,18,0.42),rgba(8,13,25,0.9)),linear-gradient(110deg,rgba(7,95,66,0.92),rgba(15,23,42,0.12)_58%,rgba(167,209,41,0.22))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-lime-fresh/60 to-transparent" />
        <div className="absolute bottom-20 left-8 h-32 w-32 rounded-full border border-white/10" />
      </div>

      {floatingCards.map((card) => (
        <motion.div
          key={card.name}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1, ...float }}
          transition={{ delay: card.delay, duration: reduceMotion ? 0.25 : 4.2, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
          className={`pointer-events-none absolute hidden w-40 rounded-[1.4rem] border border-white/25 bg-white/88 p-3 text-slate-950 shadow-premium backdrop-blur md:block ${card.className}`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white">
              <ShoppingBasket className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black">{card.name}</p>
              <p className="text-[11px] font-bold text-primary">{card.price}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-end px-4 pb-28 pt-16 sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl text-white">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Badge className="bg-white/15 text-white shadow-sm backdrop-blur">Neyyattinkara delivery within {deliveryRadiusKm} KM</Badge>
            <h1 className="mt-5 font-display text-[2.85rem] font-black uppercase leading-[0.92] sm:text-7xl">
              REVATHY SUPERMARKET
            </h1>
            <p className="mt-3 max-w-2xl font-display text-2xl font-black leading-tight text-lime-fresh sm:text-4xl">
              {title}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              {subtitle}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }} className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Button asChild size="lg" variant="secondary" className="h-14 w-full rounded-2xl text-base sm:w-auto">
              <Link href={href}>
                Start shopping <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-14 w-full rounded-2xl bg-white/12 text-white backdrop-blur hover:bg-white/20 sm:w-auto">
              <Link href="/cart">View cart</Link>
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }} className="mt-7 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/30 bg-white/16 p-2 backdrop-blur-xl sm:grid-cols-4">
            {[
              { icon: Search, value: "50+", label: "Products" },
              { icon: Bike, value: `${deliveryRadiusKm} KM`, label: "Delivery" },
              { icon: CreditCard, value: "COD/UPI", label: "Payment" },
              { icon: ReceiptText, value: gstEnabled ? "GST" : "Bill", label: "Invoice" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/18 px-3 py-3 text-center shadow-sm">
                <item.icon className="mx-auto h-4 w-4 text-lime-fresh" />
                <p className="mt-1 font-display text-base font-black">{item.value}</p>
                <p className="mt-1 text-[11px] font-bold text-white/72">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="pointer-events-none absolute bottom-16 right-5 hidden rounded-full border border-white/20 bg-white/12 p-4 text-white shadow-premium backdrop-blur md:block"
      >
        <Sparkles className="h-8 w-8 text-lime-fresh" />
      </motion.div>
    </section>
  );
}
