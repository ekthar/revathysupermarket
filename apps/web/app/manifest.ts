import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { getPublicStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let storeName = "Revathy Supermarket";
  try {
    const settings = await getPublicStoreSettings();
    storeName = settings.storeName || storeName;
  } catch {}

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("next-auth.session-token") || cookieStore.get("__Secure-next-auth.session-token");
  const isLoggedIn = !!sessionCookie?.value;

  const shortcuts: MetadataRoute.Manifest["shortcuts"] = [
    { name: "Search products", short_name: "Search", url: "/products", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    { name: "Open cart", short_name: "Cart", url: "/cart", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
  ];

  if (isLoggedIn) {
    shortcuts.push(
      { name: "My orders", short_name: "Orders", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My account", short_name: "Account", url: "/account", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }
    );
  } else {
    shortcuts.push(
      { name: "Sign in", short_name: "Login", url: "/login", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }
    );
  }

  return {
    id: "/",
    name: storeName,
    short_name: storeName.split(" ")[0],
    description: `Fresh groceries delivered from ${storeName}. Order online with COD & UPI.`,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "fullscreen", "minimal-ui"],
    orientation: "portrait-primary",
    launch_handler: { client_mode: "navigate-existing" },
    categories: ["shopping", "food", "lifestyle"],
    dir: "ltr",
    lang: "en",
    prefer_related_applications: false,
    shortcuts,
    background_color: "#F7F7FA",
    theme_color: "#020617",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      }
    ],
    screenshots: [],
  };
}
