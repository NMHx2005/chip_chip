import type { Locale } from "@/i18n/routing";

/**
 * `alternates.languages` for an article that does not necessarily exist in
 * every locale.
 *
 * A locale with no URL is left out rather than pointed at that locale's
 * listing page: hreflang says "this is the same document in another
 * language", and a listing page is not that — it is invalid hreflang that
 * search engines and crawlers would follow to the wrong place. `x-default`
 * falls back to `defaultLocale`'s URL when it has one, so a crawler that
 * matches none of the listed languages still lands on a real article
 * instead of nothing.
 *
 * Kept free of any `next-intl` navigation import (unlike `@/lib/seo`) so it
 * can be unit tested directly.
 */
export function articleLanguageAlternates(
  urlByLocale: Partial<Record<Locale, string | null>>,
  defaultLocale: Locale
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of Object.keys(urlByLocale) as Locale[]) {
    const url = urlByLocale[locale];
    if (url) languages[locale] = url;
  }

  const defaultUrl = urlByLocale[defaultLocale];
  if (defaultUrl) languages["x-default"] = defaultUrl;

  return languages;
}
