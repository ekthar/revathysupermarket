"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CreditCard, LocateFixed, ShoppingBasket, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "store:onboarding-seen:v1";

const slides = [
  {
    icon: ShoppingBasket,
    title: "Fresh groceries in a few taps",
    text: "Browse your local supermarket like a mobile app, add essentials, and keep your cart ready across visits."
  },
  {
    icon: LocateFixed,
    title: "Delivery area verified",
    text: "Checkout checks your pincode and live location so staff can process only serviceable orders."
  },
  {
    icon: CreditCard,
    title: "Pay when groceries arrive",
    text: "Choose COD or UPI on delivery, then track each order from received to delivered."
  }
];

export function WebOnboarding() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    setReady(true);
    setOpen(!seen);
  }, [pathname]);

  function close() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  if (!ready || pathname.startsWith("/admin")) return null;
  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/58 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
            className="glass-panel w-full max-w-md overflow-hidden rounded-[2rem] bg-card p-4 text-card-foreground"
          >
            <div className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.96),rgba(10,107,75,0.95))] p-5 text-white">
              <button
                type="button"
                onClick={close}
                aria-label="Close onboarding"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white backdrop-blur transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-lime-fresh/25 blur-3xl" />
              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-primary shadow-lg">
                  <Icon className="h-7 w-7" />
                </span>
                <p className="mt-5 text-xs font-black uppercase tracking-wide text-lime-fresh">Welcome</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.title}
                    initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
                    transition={{ duration: 0.24 }}
                  >
                    <h2 className="mt-2 font-display text-3xl font-black leading-tight">{slide.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-white/82">{slide.text}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {slides.map((item, slideIndex) => (
                <button
                  key={item.title}
                  type="button"
                  aria-label={`Show onboarding slide ${slideIndex + 1}`}
                  onClick={() => setIndex(slideIndex)}
                  className={slideIndex === index ? "h-2 w-8 rounded-full bg-primary" : "h-2 w-2 rounded-full bg-muted-foreground/30"}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              {index < slides.length - 1 ? (
                <Button type="button" className="h-12 rounded-2xl" onClick={() => setIndex((current) => current + 1)}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button asChild className="h-12 rounded-2xl" onClick={close}>
                  <Link href="/products">
                    Start shopping <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={close}>
                  Skip
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-2xl" onClick={close}>
                  <Link href="/login?mode=register">Create account</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
