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

  for (const route of STATIC_ROUTES) {
    for (const locale of routing.locales) {
      entries.push({
        url: url(route, locale),
        lastModified: new Date(),
        changeFrequency: route === "/" ? "weekly" : "monthly",
        priority: route === "/" ? 1 : 0.8,
      });
    }
  }

  for (const topic of TOPIC_IDS) {
    for (const locale of routing.locales) {
      entries.push({
        url: url({ pathname: "/bai-hoc/[topic]", params: { topic } }, locale),
        lastModified: new Date(),
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
    const href =
      post.kind === "lesson" && post.topic
        ? {
            pathname: "/bai-hoc/[topic]/[slug]" as const,
            params: { topic: post.topic, slug: post.slug },
          }
        : {
            pathname: "/dien-dan/[slug]" as const,
            params: { slug: post.slug },
          };

    entries.push({
      url: url(href, post.locale),
      lastModified: post.published_at ? new Date(post.published_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
