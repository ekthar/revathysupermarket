import type { MetadataRoute } from "next";
import { getPublicStoreSettings } from "@/lib/store-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicStoreSettings();
  return {
    id: "/",
    name: settings.storeName,
    short_name: settings.storeName.split(" ")[0],
    description: `Fresh groceries delivered from ${settings.storeName}. Order online with COD & UPI.`,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    categories: ["shopping", "food", "lifestyle"],
    dir: "ltr",
    lang: "en",
    prefer_related_applications: false,
    shortcuts: [
      { name: "Search products", short_name: "Search", url: "/products", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My orders", short_name: "Orders", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Open cart", short_name: "Cart", url: "/cart", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }
    ],
    background_color: "#FFFFFF",
    theme_color: "#0F8A5F",
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
    ]
  };
}
