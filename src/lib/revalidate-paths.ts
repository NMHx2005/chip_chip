import { routing, type Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";
import type { PostKind } from "@/lib/types";

/**
 * One post row's identity for the purpose of cache invalidation: enough to
 * build every localized URL that shows it.
 *
 * A caller passes both the row's old and new shape (e.g. old topic and new
 * topic) in the same array when something about the row changed, so both
 * locations get revalidated — this module has no notion of "before/after"
 * itself, only of which paths a given shape resolves to.
 */
export type PostRow = {
  locale: Locale;
  slug: string;
  kind: PostKind;
  topic: TopicId | null;
};

type PathKey = keyof typeof routing.pathnames;

/**
 * Resolves one entry of `routing.pathnames` to a localized, absolute path.
 *
 * This re-derives what next-intl's own `getPathname` (see src/i18n/navigation
 * and src/app/sitemap.ts) computes from the same `routing.pathnames` table,
 * rather than calling it directly: `getPathname` pulls in `next/navigation`
 * through next-intl's navigation factory, which Vitest's plain Node
 * environment cannot resolve (a pre-existing ESM interop gap between Next 14
 * and Vite/Vitest, unrelated to this module), so no test in this repo can
 * import `@/i18n/navigation`. Reading `routing.pathnames` directly keeps this
 * a single source of truth while staying testable.
 */
function localizedPath(key: PathKey, locale: Locale, params?: Record<string, string>): string {
  const entry = routing.pathnames[key];
  const template: string = typeof entry === "string" ? entry : entry[locale];
  const path = params
    ? Object.entries(params).reduce((acc, [name, value]) => acc.replace(`[${name}]`, value), template)
    : template;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Every path whose cached rendering could depend on the given rows.
 *
 * Kept separate from the `revalidatePath` calls (in src/app/admin/actions.ts)
 * so the path logic can be unit tested without a request context.
 */
export function revalidatePostRows(rows: PostRow[]): string[] {
  const paths = new Set<string>();

  for (const locale of routing.locales) {
    paths.add(localizedPath("/", locale));
    paths.add(localizedPath("/blog", locale));
    paths.add(localizedPath("/bai-hoc", locale));
  }

  for (const row of rows) {
    if (row.kind === "lesson" && row.topic) {
      paths.add(localizedPath("/bai-hoc/[topic]", row.locale, { topic: row.topic }));
      paths.add(
        localizedPath("/bai-hoc/[topic]/[slug]", row.locale, { topic: row.topic, slug: row.slug })
      );
    } else if (row.kind === "forum") {
      paths.add(localizedPath("/blog/[slug]", row.locale, { slug: row.slug }));
    }
    // A video row only needs the listings above refreshed — per-video pages
    // arrive in DA3, so there is nothing else to revalidate yet.
  }

  return [...paths];
}
