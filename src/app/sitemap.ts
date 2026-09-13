import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { TOPIC_IDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Public routes, excluding admin and API. */
const STATIC_ROUTES = ["/", "/bai-hoc", "/dien-dan", "/gioi-thieu"] as const;

function url(href: Parameters<typeof getPathname>[0]["href"], locale: string) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // No meaningful timestamp exists for these routes, so `lastModified` is
  // omitted rather than stamped with the request time — reporting every page
  // as just-changed on every crawl trains Googlebot to distrust the field.
  for (const route of STATIC_ROUTES) {
    for (const locale of routing.locales) {
      entries.push({
        url: url(route, locale),
        changeFrequency: route === "/" ? "weekly" : "monthly",
        priority: route === "/" ? 1 : 0.8,
      });
    }
  }

  for (const topic of TOPIC_IDS) {
    for (const locale of routing.locales) {
      entries.push({
        url: url({ pathname: "/bai-hoc/[topic]", params: { topic } }, locale),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  if (!isSupabaseConfigured) return entries;

  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, locale, kind, topic, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1000);

  for (const post of data ?? []) {
    // A lesson row without a topic cannot form a valid `/bai-hoc/[topic]/...`
    // URL, and falling through to `/dien-dan/[slug]` would 404 instead.
    if (post.kind === "lesson" && !post.topic) continue;

    const href =
      post.kind === "lesson"
        ? {
            pathname: "/bai-hoc/[topic]/[slug]" as const,
            params: { topic: post.topic as string, slug: post.slug },
          }
        : {
            pathname: "/dien-dan/[slug]" as const,
            params: { slug: post.slug },
          };

    entries.push({
      url: url(href, post.locale),
      // Omit rather than lie when the row has no publish timestamp.
      ...(post.published_at ? { lastModified: new Date(post.published_at) } : {}),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
