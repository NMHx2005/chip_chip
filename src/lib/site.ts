/**
 * Canonical site origin.
 *
 * Read through this module rather than `process.env` so the fallback lives in
 * one place — metadata, the sitemap, robots.txt and the Open Graph cards all
 * have to agree on it, and three copies of the same `??` drifted apart once
 * already.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://projectchipchip.org"
).replace(/\/+$/, "");

/** Host without the scheme — for display on the Open Graph card. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
