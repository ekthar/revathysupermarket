import type { MetadataRoute } from "next";
import { getPublicStoreSettings } from "@/lib/store-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicStoreSettings();
  return {
    name: settings.storeName,
    short_name: settings.storeName.split(" ")[0],
    description: `Fresh groceries delivered from ${settings.storeName}. Order online with COD & UPI.`,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0F8A5F",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}
