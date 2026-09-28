import { notFound } from "next/navigation";

/**
 * Catches every URL under a locale that no other route matched (e.g.
 * `/vi/khong-ton-tai`), so it renders `[locale]/not-found.tsx` — with the
 * navbar, footer and correct `lang` — instead of Next's built-in English 404.
 * Standard next-intl pattern: https://next-intl.dev/docs/environments/error-files#not-found
 */
export default function CatchAllPage() {
  notFound();
}
