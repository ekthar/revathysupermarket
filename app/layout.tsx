import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Providers } from "@/components/providers";
import { SITE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Revathy Supermarket | Fresh Groceries",
    template: "%s | Revathy"
  },
  description: "Order fresh groceries from Revathy Supermarket in Neyyattinkara. COD & UPI on delivery.",
  applicationName: "Revathy",
  appleWebApp: { capable: true, title: "Revathy", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user?.id ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  } : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}>
        <Providers>
          <Header user={user} />
          <div className="pb-safe">{children}</div>
          <MobileBottomNav user={user} />
        </Providers>
      </body>
    </html>
  );
}
