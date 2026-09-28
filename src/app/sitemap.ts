import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { TOPIC_IDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { postSitemapEntries } from "@/lib/sitemap-entries";

/** Public routes, excluding admin and API. */
// The search page is left out on purpose: it is `noindex`.
const STATIC_ROUTES = ["/", "/bai-hoc", "/video", "/blog", "/gioi-thieu"] as const;

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

  entries.push(...postSitemapEntries(data));

  return entries;
}
