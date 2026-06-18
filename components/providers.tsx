"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart/cart-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { PushNotificationManager } from "@/components/push-notification-manager";
import { ToastProvider } from "@/components/toast-provider";
import { ProfileSync } from "@/components/profile-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>
          {children}
          <ProfileSync />
          <ServiceWorkerRegister />
          <PushNotificationManager />
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
