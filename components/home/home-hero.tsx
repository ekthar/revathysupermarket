"use client";

import Link from "next/link";
import { ArrowRight, Bike, CreditCard, ReceiptText, Search } from "lucide-react";
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

export function HomeHero({ title, subtitle, href, image, deliveryRadiusKm, gstEnabled }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 18 };

  return (
    <section className="relative isolate overflow-hidden rounded-b-[2rem] bg-slate-950 sm:rounded-b-[3rem]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,12,0.58),rgba(7,13,24,0.9)),linear-gradient(110deg,rgba(5,82,58,0.9),rgba(15,23,42,0.24)_58%,rgba(167,209,41,0.12))]" />
      </div>

      <div className="relative mx-auto flex min-h-[540px] max-w-7xl items-end px-4 pb-20 pt-16 sm:min-h-[590px] sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl text-white">
          <motion.div initial={initial} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Badge className="bg-white/15 text-white shadow-sm">Neyyattinkara delivery within {deliveryRadiusKm} KM</Badge>
            <h1 className="mt-5 font-display text-[2.55rem] font-black uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
              REVATHY SUPERMARKET
            </h1>
            <p className="mt-3 max-w-2xl font-display text-2xl font-black leading-tight text-lime-fresh sm:text-4xl">
              {title}
            </p>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/90 sm:text-lg">
              {subtitle}
            </p>
          </motion.div>

          <motion.div initial={initial} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }} className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Button asChild size="lg" variant="secondary" className="h-14 w-full rounded-2xl text-base sm:w-auto">
              <Link href={href}>
                Start shopping <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-14 w-full rounded-2xl bg-white/12 text-white hover:bg-white/20 sm:w-auto">
              <Link href="/cart">View cart</Link>
            </Button>
          </motion.div>

          <motion.div initial={initial} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.35 }} className="mt-7 grid grid-cols-2 gap-2 rounded-[1.5rem] border border-white/30 bg-slate-950/60 p-2 sm:grid-cols-4">
            {[
              { icon: Search, value: "50+", label: "Products" },
              { icon: Bike, value: `${deliveryRadiusKm} KM`, label: "Delivery" },
              { icon: CreditCard, value: "COD/UPI", label: "Payment" },
              { icon: ReceiptText, value: gstEnabled ? "GST" : "Bill", label: "Invoice" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/12 px-3 py-3 text-center shadow-sm">
                <item.icon className="mx-auto h-4 w-4 text-lime-fresh" />
                <p className="mt-1 font-display text-base font-black">{item.value}</p>
                <p className="mt-1 text-[11px] font-bold text-white/82">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
