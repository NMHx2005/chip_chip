import { describe, expect, it } from "vitest";
import {
  formatBytes,
  isMediaPath,
  postsUsingUrl,
  sortMediaNewestFirst,
  type MediaObject,
} from "@/lib/media";

const object = (path: string, createdAt: string | null, size = 1000): MediaObject => ({
  path,
  name: path.split("/")[1],
  folder: path.split("/")[0],
  url: `https://example.test/${path}`,
  size,
  createdAt,
});

describe("isMediaPath", () => {
  it("accepts what the uploader writes", () => {
    expect(isMediaPath("2026-10/3f9a1c.webp")).toBe(true);
    expect(isMediaPath("2026-10/A_b-1.avif")).toBe(true);
  });

  it("refuses anything else", () => {
    for (const path of [
      "3f9a1c.webp",
      "2026-10/nested/3f9a.webp",
      "../2026-10/x.webp",
      "2026-10/../secret.webp",
      "2026-10/",
      "/etc/passwd",
      "",
    ]) {
      expect(isMediaPath(path)).toBe(false);
    }
  });
});

describe("sortMediaNewestFirst", () => {
  it("puts the newest first", () => {
    const sorted = sortMediaNewestFirst([
      object("2026-09/a.webp", "2026-09-01T00:00:00Z"),
      object("2026-10/b.webp", "2026-10-01T00:00:00Z"),
      object("2026-10/c.webp", "2026-10-02T00:00:00Z"),
    ]);
    expect(sorted.map((item) => item.path)).toEqual([
      "2026-10/c.webp",
      "2026-10/b.webp",
      "2026-09/a.webp",
    ]);
  });

  it("keeps an object with no timestamp at the end, and does not mutate the input", () => {
    const input = [object("2026-10/a.webp", null), object("2026-10/b.webp", "2026-10-01T00:00:00Z")];
    expect(sortMediaNewestFirst(input).map((item) => item.path)).toEqual([
      "2026-10/b.webp",
      "2026-10/a.webp",
    ]);
    expect(input[0].path).toBe("2026-10/a.webp");
  });
});

describe("formatBytes", () => {
  it("reads in the unit that fits", () => {
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("never shows a negative or a NaN", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(-5)).toBe("0 KB");
    expect(formatBytes(Number.NaN)).toBe("0 KB");
  });
});

describe("postsUsingUrl", () => {
  const url = "https://example.test/storage/v1/object/public/post-images/2026-10/a.webp";

  it("finds a cover image", () => {
    const posts = [{ id: "1", title: "Bài A", content: null, coverImageUrl: url }];
    expect(postsUsingUrl(posts, url)).toEqual([{ id: "1", title: "Bài A" }]);
  });

  it("finds an image inside the body", () => {
    const posts = [
      {
        id: "2",
        title: "Bài B",
        coverImageUrl: null,
        content: { type: "doc", content: [{ type: "image", attrs: { src: url } }] },
      },
    ];
    expect(postsUsingUrl(posts, url)).toEqual([{ id: "2", title: "Bài B" }]);
  });

  it("reports nothing for an image nobody uses", () => {
    const posts = [
      { id: "3", title: "Bài C", content: { type: "doc", content: [] }, coverImageUrl: null },
    ];
    expect(postsUsingUrl(posts, url)).toEqual([]);
  });

  it("labels an untitled article rather than showing an empty name", () => {
    const posts = [{ id: "4", title: "", content: null, coverImageUrl: url }];
    expect(postsUsingUrl(posts, url)[0].title).toBe("(chưa có tiêu đề)");
  });
});
