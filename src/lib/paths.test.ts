import { describe, expect, it } from "vitest";
import { localizedPath, postHref, postPath } from "@/lib/paths";

describe("postHref", () => {
  it("puts a lesson under its topic", () => {
    expect(postHref({ kind: "lesson", slug: "chat-ban-dan", topic: "nguyen-ly" })).toEqual({
      pathname: "/bai-hoc/[topic]/[slug]",
      params: { topic: "nguyen-ly", slug: "chat-ban-dan" },
    });
  });

  it("puts a blog post under /blog and a video under /video", () => {
    expect(postHref({ kind: "forum", slug: "tin-moi", topic: null })).toEqual({
      pathname: "/blog/[slug]",
      params: { slug: "tin-moi" },
    });
    expect(postHref({ kind: "video", slug: "transistor", topic: "nguyen-ly" })).toEqual({
      pathname: "/video/[slug]",
      params: { slug: "transistor" },
    });
  });

  it("has no page for a lesson without a topic or a post without a slug", () => {
    expect(postHref({ kind: "lesson", slug: "mo-coi", topic: null })).toBeNull();
    expect(postHref({ kind: "forum", slug: "", topic: null })).toBeNull();
    expect(postHref({ kind: "video", slug: "", topic: null })).toBeNull();
  });
});

describe("postPath", () => {
  it("localizes every kind in Vietnamese", () => {
    expect(postPath({ kind: "lesson", slug: "chat-ban-dan", topic: "dinh-nghia" }, "vi")).toBe(
      "/vi/bai-hoc/dinh-nghia/chat-ban-dan"
    );
    expect(postPath({ kind: "forum", slug: "tin-moi", topic: null }, "vi")).toBe("/vi/blog/tin-moi");
    expect(postPath({ kind: "video", slug: "transistor-la-gi", topic: null }, "vi")).toBe(
      "/vi/video/transistor-la-gi"
    );
  });

  it("localizes every kind in English", () => {
    expect(postPath({ kind: "lesson", slug: "what-is-it", topic: "dinh-nghia" }, "en")).toBe(
      "/en/lessons/dinh-nghia/what-is-it"
    );
    expect(postPath({ kind: "forum", slug: "news", topic: null }, "en")).toBe("/en/blog/news");
    expect(postPath({ kind: "video", slug: "what-is-a-transistor", topic: null }, "en")).toBe(
      "/en/videos/what-is-a-transistor"
    );
  });

  it("returns null when the post has no page", () => {
    expect(postPath({ kind: "lesson", slug: "mo-coi", topic: null }, "en")).toBeNull();
  });
});

describe("localizedPath", () => {
  it("resolves the new static routes per locale", () => {
    expect(localizedPath("/video", "vi")).toBe("/vi/video");
    expect(localizedPath("/video", "en")).toBe("/en/videos");
    expect(localizedPath("/tim-kiem", "vi")).toBe("/vi/tim-kiem");
    expect(localizedPath("/tim-kiem", "en")).toBe("/en/search");
    expect(localizedPath("/", "en")).toBe("/en");
  });

  it("resolves the DA4 trust pages per locale", () => {
    expect(localizedPath("/lien-he", "vi")).toBe("/vi/lien-he");
    expect(localizedPath("/lien-he", "en")).toBe("/en/contact");
    expect(localizedPath("/dong-gop", "vi")).toBe("/vi/dong-gop");
    expect(localizedPath("/dong-gop", "en")).toBe("/en/contribute");
    expect(localizedPath("/chinh-sach-bao-mat", "vi")).toBe("/vi/chinh-sach-bao-mat");
    expect(localizedPath("/chinh-sach-bao-mat", "en")).toBe("/en/privacy");
  });
});
