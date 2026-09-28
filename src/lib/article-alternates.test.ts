import { describe, expect, it } from "vitest";
import { articleLanguageAlternates } from "@/lib/article-alternates";

describe("articleLanguageAlternates", () => {
  it("lists every locale that has a URL", () => {
    expect(
      articleLanguageAlternates({ vi: "/vi/blog/a", en: "/en/blog/a" }, "vi")
    ).toEqual({
      vi: "/vi/blog/a",
      en: "/en/blog/a",
      "x-default": "/vi/blog/a",
    });
  });

  it("omits a locale with no translation instead of pointing it at a listing page", () => {
    expect(articleLanguageAlternates({ vi: "/vi/blog/a", en: null }, "vi")).toEqual({
      vi: "/vi/blog/a",
      "x-default": "/vi/blog/a",
    });
  });

  it("omits x-default when the default locale has no translation", () => {
    expect(articleLanguageAlternates({ vi: null, en: "/en/blog/a" }, "vi")).toEqual({
      en: "/en/blog/a",
    });
  });

  it("returns an empty object when nothing has a translation", () => {
    expect(articleLanguageAlternates({ vi: null, en: null }, "vi")).toEqual({});
  });
});
