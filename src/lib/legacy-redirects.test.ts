import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS } from "@/lib/legacy-redirects.mjs";
import { routing } from "@/i18n/routing";

/**
 * The forum became the blog. Old links in search results and shared posts
 * must keep working, and must say so permanently (301) so search engines move
 * their ranking to the new URL instead of keeping both.
 */
describe("LEGACY_REDIRECTS", () => {
  const blog = routing.pathnames["/blog"];

  it("moves both locales' listing to the blog listing", () => {
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/vi/dien-dan",
      destination: `/vi${blog}`,
      statusCode: 301,
    });
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/en/forum",
      destination: `/en${blog}`,
      statusCode: 301,
    });
  });

  it("keeps the article slug when moving an article", () => {
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/vi/dien-dan/:slug",
      destination: `/vi${blog}/:slug`,
      statusCode: 301,
    });
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/en/forum/:slug",
      destination: `/en${blog}/:slug`,
      statusCode: 301,
    });
  });

  it("never points a route at itself", () => {
    for (const rule of LEGACY_REDIRECTS) {
      expect(rule.destination).not.toBe(rule.source);
    }
  });
});
