"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FlyingItem {
  id: number;
  imgSrc: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  endX: number;
  endY: number;
}

interface FlyContextValue {
  flyToCart: (imgSrc: string, element: HTMLElement) => void;
}

const FlyContext = createContext<FlyContextValue>({ flyToCart: () => {} });

export function useFlyToCart() {
  return useContext(FlyContext);
}

function ClientPortal({ items }: { items: FlyingItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.img
            key={item.id}
            src={item.imgSrc}
            alt="Product added to cart"
            style={{
              position: "absolute",
              willChange: "transform, opacity",
            }}
            initial={{
              left: item.startX - item.width / 2,
              top: item.startY - item.height / 2,
              width: item.width,
              height: item.height,
              borderRadius: 8,
              opacity: 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            animate={{
              left: item.endX - 12,
              top: item.endY - 12,
              width: 24,
              height: 24,
              borderRadius: "50%",
              opacity: 0.6,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 22, mass: 0.6 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function FlyToCartProvider({ children, cartSelector = "[data-cart-icon]" }: { children: ReactNode; cartSelector?: string }) {
  const [items, setItems] = useState<FlyingItem[]>([]);
  const idRef = useRef(0);

  const flyToCart = useCallback((imgSrc: string, element: HTMLElement) => {
    const cartEls = document.querySelectorAll<HTMLElement>(cartSelector);
    let cartEl: HTMLElement | null = null;
    for (const el of cartEls) {
      if (el.offsetParent !== null) {
        cartEl = el;
        break;
      }
    }
    if (!cartEl) return;

    const from = element.getBoundingClientRect();
    const to = cartEl.getBoundingClientRect();
    const id = ++idRef.current;

    setItems((prev) => [...prev, {
      id,
      imgSrc,
      startX: from.left + from.width / 2,
      startY: from.top + from.height / 2,
      width: from.width,
      height: from.height,
      endX: to.left + to.width / 2,
      endY: to.top + to.height / 2,
    }]);

    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 700);
  }, [cartSelector]);

  return (
    <FlyContext.Provider value={{ flyToCart }}>
      {children}
      <ClientPortal items={items} />
    </FlyContext.Provider>
  );
}
