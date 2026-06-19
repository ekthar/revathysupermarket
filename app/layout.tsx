import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Providers } from "@/components/providers";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
import { getPublicStoreSettings } from "@/lib/store-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicStoreSettings();
  return {
    title: { default: `${settings.storeName} | Fresh Groceries`, template: `%s | ${settings.storeName}` },
    description: `Order fresh groceries from ${settings.storeName}. COD & UPI on delivery.`,
    applicationName: settings.storeName,
    appleWebApp: { capable: true, title: settings.storeName, statusBarStyle: "default" },
    manifest: "/manifest.webmanifest"
  };
}

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ScrollProgress />
          <OnboardingTour />
          <Header user={user} storeName={settings.storeName} storeAddress={settings.address} />
          <div className="pb-safe">{children}</div>
          <MobileBottomNav user={user} />
        </Providers>
      </body>
    </html>
  );
}
