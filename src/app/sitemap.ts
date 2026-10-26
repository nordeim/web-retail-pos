import type { MetadataRoute } from "next";

import { NAV_ITEMS } from "@/lib/router";
import { siteUrl } from "@/lib/site";

// Root + the 8 view paths + /login = 10 URLs (the site.test.ts contract's
// documented consumer). The exact-match SPA rewrites never touch /sitemap.xml
// (prerendered at build time).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...NAV_ITEMS.map((item) => ({
      url: `${base}${item.path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
  ];
}
