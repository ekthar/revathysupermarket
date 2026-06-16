"use client";

import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/cart/cart-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ToastProvider } from "@/components/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>
        <CartProvider>
          {children}
          <ServiceWorkerRegister />
        </CartProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
