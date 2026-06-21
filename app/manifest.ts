import type { MetadataRoute } from "next";
import { getPublicStoreSettings } from "@/lib/store-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicStoreSettings();
  return {
    id: "/",
    name: settings.storeName,
    short_name: settings.storeName.split(" ")[0],
    description: `Fresh groceries delivered from ${settings.storeName}. Order online with COD & UPI.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    categories: ["shopping", "food", "lifestyle"],
    shortcuts: [
      { name: "Search products", short_name: "Search", url: "/products" },
      { name: "My orders", short_name: "Orders", url: "/dashboard" },
      { name: "Open cart", short_name: "Cart", url: "/cart" }
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
      }
    ]
  };
}
