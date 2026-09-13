import type { StaticPathname } from "@/i18n/routing";

/**
 * Maps the current route to a safe target for the other locale.
 *
 * With localised `pathnames` configured, next-intl's `usePathname` returns the
 * internal route *template* — `/bai-hoc/[topic]`, not `/bai-hoc/dinh-nghia`
 * (its `getRoute` maps the browser path back to the declared route). Passing
 * such a template to `router.replace` without params throws "Insufficient
 * params provided for localized pathname", which silently killed the switch on
 * every parameterised page. So match on templates: that is what arrives.
 *
 * Article slugs differ per locale, so a straight path swap would 404 on a
 * detail page anyway. Every parameterised route therefore falls back to its
 * section listing, which always exists. Article pages additionally render a
 * "read in the other language" link that points at the real translation.
 *
 * Kept apart from the component so it can be unit-tested without React.
 */
const SECTION_FALLBACK: Record<string, StaticPathname> = {
  "/bai-hoc/[topic]": "/bai-hoc",
  "/bai-hoc/[topic]/[slug]": "/bai-hoc",
  "/dien-dan/[slug]": "/dien-dan",
};

export function safePathFor(pathname: string): StaticPathname | string {
  return SECTION_FALLBACK[pathname] ?? pathname;
}
