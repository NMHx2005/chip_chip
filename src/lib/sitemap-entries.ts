import type { MetadataRoute } from "next";
import { routing, type StaticPathname } from "@/i18n/routing";
import { localizedPath, postPath } from "@/lib/paths";
import { postRowsFrom } from "@/lib/revalidate-paths";
import { SITE_URL } from "@/lib/site";

/** Public routes without params, excluding admin and API. */
// The search page is left out on purpose: it is `noindex`.
export const STATIC_ROUTES: readonly StaticPathname[] = [
  "/",
  "/bai-hoc",
  "/video",
  "/blog",
  "/gioi-thieu",
  "/lien-he",
  "/dong-gop",
  "/dang-ky",
  "/bao-chi",
  "/chinh-sach-bao-mat",
];

/**
 * One entry per static route and locale.
 *
 * No meaningful timestamp exists for these routes, so `lastModified` is
 * omitted rather than stamped with the request time — reporting every page
 * as just-changed on every crawl trains Googlebot to distrust the field.
 */
export function staticSitemapEntries(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(route, locale)}`,
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : 0.8,
    }))
  );
}

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
