import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/media", "/pricing"],
      disallow: ["/app", "/dashboard", "/api/", "/auth/", "/s/", "/login"],
    },
    sitemap: toAbsoluteUrl("/sitemap.xml"),
  };
}
