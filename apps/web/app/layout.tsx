import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Providers } from "@/components/providers";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
import { getPublicShellSettings, getPublicStoreSettings } from "@/lib/store-settings";
import { Inter_Tight, Manrope } from "next/font/google";
import { ViewportStability } from "@/components/ui/viewport-stability";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-display", display: "swap" });

async function withFallback<T>(promise: Promise<T>, fallback: T, timeoutMs = 2_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.catch(() => fallback),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicStoreSettings();
  return {
    title: { default: `${settings.storeName} | Fresh Groceries`, template: `%s | ${settings.storeName}` },
    description: `Order fresh groceries from ${settings.storeName}. COD & UPI on delivery.`,
    applicationName: settings.storeName,
    formatDetection: {
      telephone: true,
      address: true,
      email: true
    },
    appleWebApp: {
      capable: true,
      title: settings.storeName,
      statusBarStyle: "black-translucent"
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
      ],
      apple: [
        { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
      ]
    },
    manifest: "/manifest.webmanifest",
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "apple-mobile-web-app-title": settings.storeName,
      "msapplication-TileColor": "#050505",
      // Samsung Internet PWA hints
      "application-name": settings.storeName,
      "msapplication-starturl": "/",
      "msapplication-navbutton-color": "#050505"
    }
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" }
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, shell] = await Promise.all([
    withFallback(auth(), null),
    getPublicShellSettings(),
  ]);
  const { settings, logoUrl } = shell;
  const user = session?.user?.id ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  } : null;

  return (
    <html lang="en" suppressHydrationWarning className={`${interTight.variable} ${manrope.variable}`}>
      <head>
        {/* Preconnect to image CDN for faster LCP */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="pt-safe">
        <Providers session={session}>
          <ViewportStability />
          <ScrollProgress />
          <OnboardingTour />
          <Header user={user} storeName={settings.storeName} storeAddress={settings.address} logoUrl={logoUrl} />
          <Suspense>
            <div className="pb-safe route-scroll-container">{children}</div>
          </Suspense>
          <ScrollToTop />
          <MobileBottomNav user={user} />
        </Providers>
      </body>
    </html>
  );
}
