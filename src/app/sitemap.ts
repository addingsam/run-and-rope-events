import type { MetadataRoute } from "next";
import { listPublishedEventsForSitemap } from "@/lib/seo/list-sitemap-events";
import { SITE_URL, STATIC_PUBLIC_ROUTES } from "@/lib/seo/site-config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let eventEntries: MetadataRoute.Sitemap = [];

  try {
    const events = await listPublishedEventsForSitemap();
    eventEntries = events.map((event) => ({
      url: `${SITE_URL}/events/${event.id}`,
      lastModified: new Date(event.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to build event sitemap entries:", error);
  }

  return [...staticEntries, ...eventEntries];
}
