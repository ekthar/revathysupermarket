import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
// Leaflet stylesheet must be globally available. The map components are
// lazy-loaded (ssr:false), and CSS side-effect imports inside dynamically-
// loaded client components aren't reliably injected by the App Router.
import "leaflet/dist/leaflet.css";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Providers } from "@/components/providers";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { WelcomeOnboarding } from "@/components/onboarding/welcome-onboarding";
import { CoachMarks } from "@/components/onboarding/coach-marks";
import { AnnouncementBar } from "@/components/navigation/announcement-bar";
import { getPublicShellSettings, getPublicStoreSettings } from "@/lib/store-settings";
import { Inter_Tight, Manrope } from "next/font/google";
import { Footer } from "@/components/footer";
import { ViewportStability } from "@/components/ui/viewport-stability";
import { RouteTransition } from "@/components/ui/route-transition";
import { SwipeBack } from "@/components/ui/swipe-back";
import { NavigationDirection } from "@/components/ui/navigation-direction";
import { PredictivePrefetch } from "@/components/predictive-prefetch";
import { FloatingCartBar } from "@/components/cart/floating-cart-bar";
import { LiveOrderMiniBar } from "@/components/tracking/live-order-mini-bar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { PermissionGate } from "@/components/native/permission-gate";
import { AlarmOverlay } from "@/components/native/alarm-overlay";
import { NativeInit } from "@/components/native/native-init";
import { NativeBackButton } from "@/components/native/native-back-button";
import { AppLifecycle } from "@/components/native/app-lifecycle";
import { NetworkStatus } from "@/components/native/network-status";

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
    openGraph: {
      type: 'website' as const,
      siteName: settings.storeName,
      title: `${settings.storeName} | Fresh Groceries`,
      description: `Order fresh groceries from ${settings.storeName}. COD & UPI on delivery.`,
      images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: settings.storeName }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${settings.storeName} | Fresh Groceries`,
      description: `Order fresh groceries from ${settings.storeName}. COD & UPI on delivery.`,
      images: ['/icons/icon-512.png'],
    },
    robots: { index: true, follow: true },
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
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, shell, locale, messages] = await Promise.all([
    withFallback(auth(), null),
    getPublicShellSettings(),
    getLocale(),
    getMessages(),
  ]);
  const { settings, logoUrl } = shell;
  const user = session?.user?.id ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  } : null;

  return (
    <html lang={locale} suppressHydrationWarning className={`${interTight.variable} ${manrope.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="pt-safe">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:rounded-xl focus:bg-black focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:shadow-lg">
          Skip to main content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers session={session}>
            <PermissionGate>
            <NativeInit />
            <NativeBackButton />
            <AppLifecycle />
            <NetworkStatus />
            <ViewportStability />
            <ScrollProgress />
            <NavigationDirection />
            <PredictivePrefetch />
            <WelcomeOnboarding />
            <CoachMarks />
            <AlarmOverlay />
            <AnnouncementBar />
            <Header user={user} storeName={settings.storeName} storeAddress={settings.address} logoUrl={logoUrl} />
            <LiveOrderMiniBar />
            <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
              <div
                id="main-content"
                className="pb-safe route-scroll-container"
                tabIndex={-1}
                aria-live="polite"
                aria-label="Page content"
              >
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-2">
                <Breadcrumbs />
              </div>
              <RouteTransition><SwipeBack>{children}</SwipeBack></RouteTransition></div>
            </Suspense>
            <Footer storeName={settings.storeName} address={settings.address} />
            <ScrollToTop />
            <FloatingCartBar />
            <MobileBottomNav user={user} />
            </PermissionGate>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
