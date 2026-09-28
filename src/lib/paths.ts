import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";
import type { PostKind } from "@/lib/types";

/** The next-intl href of one published post's own page. */
export type PostHref =
  | { pathname: "/bai-hoc/[topic]/[slug]"; params: { topic: TopicId; slug: string } }
  | { pathname: "/blog/[slug]"; params: { slug: string } }
  | { pathname: "/video/[slug]"; params: { slug: string } };

/** What a post needs to be linked to — a PostSummary or a PostRow both fit. */
export type PostLink = { kind: PostKind; slug: string; topic: TopicId | null };

/**
 * Where a post lives, for every kind.
 *
 * The single place that knows lessons sit under their topic, blog posts under
 * /blog and videos under /video — cards, search results, the sitemap and cache
 * invalidation all read it, so they cannot disagree. Returns null when no page
 * can serve the post: a lesson without a topic, or a row without a slug.
 */
export function postHref(post: PostLink): PostHref | null {
  if (!post.slug) return null;
  switch (post.kind) {
    case "lesson":
      return post.topic
        ? { pathname: "/bai-hoc/[topic]/[slug]", params: { topic: post.topic, slug: post.slug } }
        : null;
    case "video":
      return { pathname: "/video/[slug]", params: { slug: post.slug } };
    case "forum":
      return { pathname: "/blog/[slug]", params: { slug: post.slug } };
  }
}

/**
 * Resolves one entry of `routing.pathnames` to a localized, absolute path.
 *
 * This re-derives what next-intl's own `getPathname` (see src/i18n/navigation)
 * computes from the same `routing.pathnames` table, rather than calling it
 * directly: `getPathname` pulls in `next/navigation` through next-intl's
 * navigation factory, which Vitest's plain Node environment cannot resolve (a
 * pre-existing ESM interop gap between Next 14 and Vite/Vitest), so no test in
 * this repo can import `@/i18n/navigation`. Reading `routing.pathnames`
 * directly keeps this a single source of truth while staying testable.
 */
export function localizedPath(
  key: AppPathname,
  locale: Locale,
  params?: Record<string, string>
): string {
  const entry = routing.pathnames[key];
  const template: string = typeof entry === "string" ? entry : entry[locale];
  const path = params
    ? Object.entries(params).reduce((acc, [name, value]) => acc.replace(`[${name}]`, value), template)
    : template;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The localized path of a post's own page, or null when it has none. */
export function postPath(post: PostLink, locale: Locale): string | null {
  const href = postHref(post);
  return href ? localizedPath(href.pathname, locale, href.params) : null;
}
