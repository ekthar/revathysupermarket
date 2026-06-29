import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/delivery", "/dashboard", "/checkout", "/staff"]
    },
    sitemap: `${SITE.url}/sitemap.xml`
  };
}
