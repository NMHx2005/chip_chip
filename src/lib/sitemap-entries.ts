import type { MetadataRoute } from "next";
import { postPath } from "@/lib/paths";
import { postRowsFrom } from "@/lib/revalidate-paths";
import { SITE_URL } from "@/lib/site";

/** A published `posts` row as the sitemap reads it. */
export type SitemapPostRow = {
  slug: string;
  locale: string;
  kind: string;
  topic: string | null;
  published_at: string | null;
};

/**
 * One sitemap entry per published post that has a page.
 *
 * Kept apart from src/app/sitemap.ts so it can be tested without Supabase or
 * next-intl's navigation. A row the app cannot place (unknown locale or kind,
 * a lesson without a topic) is left out rather than pointed at a URL that
 * would 404.
 */
export function postSitemapEntries(rows: SitemapPostRow[] | null): MetadataRoute.Sitemap {
  return (rows ?? []).flatMap((row) => {
    const [post] = postRowsFrom([row]);
    const path = post ? postPath(post, post.locale) : null;
    if (!path) return [];
    return [
      {
        url: `${SITE_URL}${path}`,
        // Omit rather than lie when the row has no publish timestamp.
        ...(row.published_at ? { lastModified: new Date(row.published_at) } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      },
    ];
  });
}
