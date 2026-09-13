import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "always",
  // Public URLs are localized (e.g. /vi/bai-hoc ↔ /en/lessons) while the file
  // system always uses the default locale's folders. Dynamic segments (topic,
  // slug) are not localized — article slugs already differ per locale in the
  // database, so an English post naturally gets an English slug.
  pathnames: {
    "/": "/",
    "/bai-hoc": { vi: "/bai-hoc", en: "/lessons" },
    "/bai-hoc/[topic]": { vi: "/bai-hoc/[topic]", en: "/lessons/[topic]" },
    "/bai-hoc/[topic]/[slug]": {
      vi: "/bai-hoc/[topic]/[slug]",
      en: "/lessons/[topic]/[slug]",
    },
    "/dien-dan": { vi: "/dien-dan", en: "/forum" },
    "/dien-dan/[slug]": { vi: "/dien-dan/[slug]", en: "/forum/[slug]" },
    "/gioi-thieu": { vi: "/gioi-thieu", en: "/about" },
  },
});

export type Locale = (typeof routing.locales)[number];

/** Every declared route, including parameterised ones. */
export type AppPathname = keyof typeof routing.pathnames;

/** Routes that can be linked to without params — no `[topic]` / `[slug]`. */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: "VI",
  en: "EN",
};

export const LOCALE_NAMES: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};
