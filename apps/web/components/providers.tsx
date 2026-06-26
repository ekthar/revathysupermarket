"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/cart/cart-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { PushNotificationManager } from "@/components/push-notification-manager";
import { FcmRegistration } from "@/components/fcm-registration";
import { ToastProvider } from "@/components/toast-provider";
import { ProfileSync } from "@/components/profile-sync";
import { InstallAppPrompt } from "@/components/install-app-prompt";
import { ThemeColorSync } from "@/components/theme-color-sync";
import { QueryProvider } from "@/components/query-provider";
import { MotionConfig } from "framer-motion";

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeColorSync />
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <CartProvider>
                {children}
                <ProfileSync />
                <ServiceWorkerRegister />
                <PushNotificationManager />
                <FcmRegistration />
                <InstallAppPrompt />
              </CartProvider>
            </ToastProvider>
          </MotionConfig>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
