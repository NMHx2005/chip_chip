import { describe, expect, it } from "vitest";
import { safePathFor } from "@/components/layout/langSwitchPath";

/**
 * Regression tests for the locale switch target.
 *
 * next-intl's `usePathname` returns the internal route *template* when
 * localised `pathnames` are configured, so `safePathFor` receives
 * `/bai-hoc/[topic]`, never `/bai-hoc/dinh-nghia`. The previous implementation
 * split the string into segments and only caught routes with two or more of
 * them, so a topic page fell through and handed the raw template to
 * `router.replace`, which threw "Insufficient params provided for localized
 * pathname" and left the button doing nothing.
 */
describe("safePathFor", () => {
  it("sends a topic page to the lessons listing", () => {
    // The case that was broken: one parameter, not two.
    expect(safePathFor("/bai-hoc/[topic]")).toBe("/bai-hoc");
  });

  it("sends a lesson article to the lessons listing", () => {
    expect(safePathFor("/bai-hoc/[topic]/[slug]")).toBe("/bai-hoc");
  });

  it("sends a forum article to the forum listing", () => {
    expect(safePathFor("/dien-dan/[slug]")).toBe("/dien-dan");
  });

  it("leaves static routes untouched", () => {
    for (const route of ["/", "/bai-hoc", "/dien-dan", "/gioi-thieu"]) {
      expect(safePathFor(route)).toBe(route);
    }
  });

  it("never returns a template with unfilled params", () => {
    const routes = [
      "/",
      "/bai-hoc",
      "/bai-hoc/[topic]",
      "/bai-hoc/[topic]/[slug]",
      "/dien-dan",
      "/dien-dan/[slug]",
      "/gioi-thieu",
    ];

    // This is the property that matters: anything still carrying a `[param]`
    // throws inside next-intl's router the moment it is used.
    for (const route of routes) {
      expect(safePathFor(route)).not.toContain("[");
    }
  });
});
