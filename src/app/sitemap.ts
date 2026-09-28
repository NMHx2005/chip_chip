import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { TOPIC_IDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { postSitemapEntries, staticSitemapEntries } from "@/lib/sitemap-entries";

function url(href: Parameters<typeof getPathname>[0]["href"], locale: string) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticSitemapEntries();

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
