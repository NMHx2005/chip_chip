import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * Canonical URL plus `alternates.languages` for a route that exists in both
 * locales under the same internal pathname.
 *
 * Without the hreflang set, `/vi/bai-hoc` and `/en/lessons` look like two
 * unrelated pages to a search engine rather than one page in two languages.
 */
export function localeAlternates(
  href: Href,
  locale: Locale
): Metadata["alternates"] {
  return {
    canonical: getPathname({ href, locale }),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ href, locale: l })])
      ),
      // Tells a crawler which version to show when no language matches,
      // instead of letting it pick one of the two at random.
      "x-default": getPathname({ href, locale: routing.defaultLocale }),
    },
  };
}
