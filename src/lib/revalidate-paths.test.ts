import { describe, expect, it } from "vitest";
import { revalidatePostRows, type PostRow } from "@/lib/revalidate-paths";

describe("revalidatePostRows", () => {
  it("always revalidates the home, blog and lessons listings for both locales", () => {
    const paths = revalidatePostRows([]);
    expect(paths).toEqual(
      expect.arrayContaining(["/vi", "/en", "/vi/blog", "/en/blog", "/vi/bai-hoc", "/en/lessons"])
    );
  });

  it("revalidates a lesson's topic page and its own detail page per locale, EN under /en/lessons", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "chat-ban-dan", kind: "lesson", topic: "nguyen-ly" },
      { locale: "en", slug: "semiconductor-chip", kind: "lesson", topic: "nguyen-ly" },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/chat-ban-dan",
        "/en/lessons/nguyen-ly",
        "/en/lessons/nguyen-ly/semiconductor-chip",
      ])
    );
  });

  it("revalidates each locale's own blog detail slug, never the other locale's", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "tin-tuc-vi", kind: "forum", topic: null },
      { locale: "en", slug: "news-en", kind: "forum", topic: null },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(expect.arrayContaining(["/vi/blog/tin-tuc-vi", "/en/blog/news-en"]));
    expect(paths).not.toContain("/vi/blog/news-en");
    expect(paths).not.toContain("/en/blog/tin-tuc-vi");
  });

  it("revalidates only the lessons listing for a video, since per-video pages arrive in DA3", () => {
    const rows: PostRow[] = [{ locale: "vi", slug: "video-vi", kind: "video", topic: null }];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(expect.arrayContaining(["/vi/bai-hoc"]));
    expect(paths.some((p) => p.includes("video-vi"))).toBe(false);
  });

  it("revalidates both the old and the new topic page when a lesson changes topic", () => {
    const oldRow: PostRow = { locale: "vi", slug: "bai-x", kind: "lesson", topic: "dinh-nghia" };
    const newRow: PostRow = { locale: "vi", slug: "bai-x", kind: "lesson", topic: "nguyen-ly" };
    const paths = revalidatePostRows([oldRow, newRow]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/dinh-nghia",
        "/vi/bai-hoc/dinh-nghia/bai-x",
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/bai-x",
      ])
    );
  });

  it("de-duplicates paths shared across rows", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "bai-x", kind: "lesson", topic: "nguyen-ly" },
      { locale: "vi", slug: "bai-x", kind: "lesson", topic: "nguyen-ly" },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths.filter((p) => p === "/vi/bai-hoc/nguyen-ly/bai-x")).toHaveLength(1);
  });
});
