import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Providers } from "@/components/providers";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
import { getPublicStoreSettings } from "@/lib/store-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicStoreSettings();
  return {
    title: { default: `${settings.storeName} | Fresh Groceries`, template: `%s | ${settings.storeName}` },
    description: `Order fresh groceries from ${settings.storeName}. COD & UPI on delivery.`,
    applicationName: settings.storeName,
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
      "apple-mobile-web-app-status-bar-style": "black-translucent"
    }
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([auth(), getPublicStoreSettings()]);
  const user = session?.user?.id ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  } : null;

  // Fetch logo URL from settings
  const logoSetting = await import("@/lib/prisma").then(m => m.prisma.setting.findUnique({ where: { key: "logoUrl" } })).catch(() => null);
  const logoUrl = logoSetting?.value || null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="pt-safe">
        <Providers>
          <ScrollProgress />
          <OnboardingTour />
          <Header user={user} storeName={settings.storeName} storeAddress={settings.address} logoUrl={logoUrl} />
          <div className="pb-safe">{children}</div>
          <ScrollToTop />
          <MobileBottomNav user={user} />
        </Providers>
      </body>
    </html>
  );
}
