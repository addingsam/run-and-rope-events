import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PATHS, SITE_URL } from "@/lib/seo/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...ROBOTS_DISALLOW_PATHS,
        "/events/*/feature",
        "/events/*/feature/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
