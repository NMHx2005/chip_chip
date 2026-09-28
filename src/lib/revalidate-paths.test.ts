import { describe, expect, it } from "vitest";
import { postRowsFrom, revalidatePostRows, type PostRow } from "@/lib/revalidate-paths";

describe("revalidatePostRows", () => {
  it("always revalidates the home, blog, lessons and video listings for both locales", () => {
    const paths = revalidatePostRows([]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi",
        "/en",
        "/vi/blog",
        "/en/blog",
        "/vi/bai-hoc",
        "/en/lessons",
        "/vi/video",
        "/en/videos",
      ])
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

  it("revalidates the video listings and each locale's own video page", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "video-vi", kind: "video", topic: "nguyen-ly" },
      { locale: "en", slug: "video-en", kind: "video", topic: "nguyen-ly" },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(
      expect.arrayContaining(["/vi/video", "/en/videos", "/vi/video/video-vi", "/en/videos/video-en"])
    );
    expect(paths).not.toContain("/vi/video/video-en");
    // A video's topic is a filter, not a page of its own.
    expect(paths).not.toContain("/vi/bai-hoc/nguyen-ly");
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

describe("postRowsFrom", () => {
  it("lets unpublishing or deleting a lesson clear its own detail and topic pages in both locales", () => {
    const paths = revalidatePostRows(
      postRowsFrom([
        { locale: "vi", slug: "chat-ban-dan", kind: "lesson", topic: "nguyen-ly" },
        { locale: "en", slug: "semiconductors", kind: "lesson", topic: "nguyen-ly" },
      ])
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/chat-ban-dan",
        "/en/lessons/nguyen-ly",
        "/en/lessons/nguyen-ly/semiconductors",
      ])
    );
  });

  it("lets unpublishing or deleting a blog post clear its own detail pages", () => {
    const paths = revalidatePostRows(
      postRowsFrom([
        { locale: "vi", slug: "tin-vi", kind: "forum", topic: null },
        { locale: "en", slug: "news-en", kind: "forum", topic: null },
      ])
    );
    expect(paths).toEqual(expect.arrayContaining(["/vi/blog/tin-vi", "/en/blog/news-en"]));
  });

  it("skips rows it cannot place and treats an unknown topic as none", () => {
    expect(
      postRowsFrom([
        { locale: "fr", slug: "x", kind: "lesson", topic: "nguyen-ly" },
        { locale: "vi", slug: "y", kind: "podcast", topic: null },
        { locale: "vi", slug: "z", kind: "lesson", topic: "khong-co" },
      ])
    ).toEqual([{ locale: "vi", slug: "z", kind: "lesson", topic: null }]);
    expect(postRowsFrom(null)).toEqual([]);
  });
});
