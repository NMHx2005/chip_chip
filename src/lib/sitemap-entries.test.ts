import { describe, expect, it } from "vitest";
import { postSitemapEntries } from "@/lib/sitemap-entries";
import { SITE_URL } from "@/lib/site";

describe("postSitemapEntries", () => {
  it("lists a video under /video in Vietnamese and /videos in English", () => {
    const entries = postSitemapEntries([
      { slug: "transistor-la-gi", locale: "vi", kind: "video", topic: null, published_at: "2026-09-20T00:00:00Z" },
      { slug: "what-is-a-transistor", locale: "en", kind: "video", topic: "nguyen-ly", published_at: null },
    ]);
    expect(entries.map((e) => e.url)).toEqual([
      `${SITE_URL}/vi/video/transistor-la-gi`,
      `${SITE_URL}/en/videos/what-is-a-transistor`,
    ]);
    expect(entries[0].lastModified).toEqual(new Date("2026-09-20T00:00:00Z"));
    expect(entries[1]).not.toHaveProperty("lastModified");
  });

  it("lists lessons and blog posts at their own pages", () => {
    const urls = postSitemapEntries([
      { slug: "chat-ban-dan", locale: "vi", kind: "lesson", topic: "dinh-nghia", published_at: null },
      { slug: "news", locale: "en", kind: "forum", topic: null, published_at: null },
    ]).map((e) => e.url);
    expect(urls).toEqual([
      `${SITE_URL}/vi/bai-hoc/dinh-nghia/chat-ban-dan`,
      `${SITE_URL}/en/blog/news`,
    ]);
  });

  it("leaves out rows no page can serve", () => {
    expect(
      postSitemapEntries([
        { slug: "mo-coi", locale: "vi", kind: "lesson", topic: null, published_at: null },
        { slug: "x", locale: "fr", kind: "video", topic: null, published_at: null },
        { slug: "y", locale: "vi", kind: "podcast", topic: null, published_at: null },
      ])
    ).toEqual([]);
    expect(postSitemapEntries(null)).toEqual([]);
  });
});
