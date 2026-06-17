import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Providers } from "@/components/providers";
import { SITE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Revathy Supermarket | Fresh Groceries in Neyyattinkara",
    template: "%s | Revathy Supermarket"
  },
  description:
    "Order fresh groceries, vegetables, fruits, dairy, snacks, and essentials from Revathy Supermarket in Neyyattinkara with COD and UPI on delivery.",
  openGraph: {
    title: "Revathy Supermarket",
    description: "Fresh groceries delivered from Revathy Supermarket in Neyyattinkara.",
    url: SITE.url,
    siteName: "Revathy Supermarket",
    locale: "en_IN",
    type: "website"
  },
  applicationName: "Revathy Supermarket",
  appleWebApp: { capable: true, title: "Revathy" },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0F8A5F",
  width: "device-width",
  initialScale: 1
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <Providers>
          <Header user={user} />
          <div className="pb-24 md:pb-0">{children}</div>
          <MobileBottomNav user={user} />
        </Providers>
      </body>
    </html>
  );
}
