import { describe, expect, it } from "vitest";
import { safePathFor, switchTarget } from "@/components/layout/langSwitchPath";

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

  it("sends a blog article to the blog listing", () => {
    expect(safePathFor("/blog/[slug]")).toBe("/blog");
  });

  it("sends a video page to the video listing", () => {
    expect(safePathFor("/video/[slug]")).toBe("/video");
  });

  it("leaves static routes untouched", () => {
    for (const route of ["/", "/bai-hoc", "/blog", "/gioi-thieu", "/video", "/tim-kiem"]) {
      expect(safePathFor(route)).toBe(route);
    }
  });

  it("never returns a template with unfilled params", () => {
    const routes = [
      "/",
      "/bai-hoc",
      "/bai-hoc/[topic]",
      "/bai-hoc/[topic]/[slug]",
      "/blog",
      "/blog/[slug]",
      "/gioi-thieu",
      "/video",
      "/video/[slug]",
      "/tim-kiem",
    ];

    // This is the property that matters: anything still carrying a `[param]`
    // throws inside next-intl's router the moment it is used.
    for (const route of routes) {
      expect(safePathFor(route)).not.toContain("[");
    }
  });
});

/**
 * Regression tests for the language switch on the search page: switching
 * language used to drop `q`, dumping the reader on an empty search page.
 */
describe("switchTarget", () => {
  it("carries the search query when switching from the search page", () => {
    expect(switchTarget("/tim-kiem", "thue thu nhap")).toEqual({
      pathname: "/tim-kiem",
      query: { q: "thue thu nhap" },
    });
  });

  it("leaves the search page path alone when there is no query", () => {
    expect(switchTarget("/tim-kiem", null)).toBe("/tim-kiem");
    expect(switchTarget("/tim-kiem", "")).toBe("/tim-kiem");
  });

  it("ignores a search query on every other route", () => {
    expect(switchTarget("/bai-hoc", "thue")).toBe("/bai-hoc");
    expect(switchTarget("/video/[slug]", "thue")).toBe("/video");
  });
});
