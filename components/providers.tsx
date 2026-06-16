"use client";

import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/cart/cart-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <CartProvider>
        {children}
        <ServiceWorkerRegister />
      </CartProvider>
    </ThemeProvider>
  );
}
