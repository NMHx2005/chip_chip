import { describe, expect, it } from "vitest";
import { embedUrl, parseVideoUrl, videoRefFrom, watchUrl } from "@/lib/video";

const YT = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
const TT = { platform: "tiktok", externalId: "7231338487075638570" } as const;

describe("parseVideoUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    "http://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abc",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "  https://youtu.be/dQw4w9WgXcQ  ",
  ])("reads the YouTube id from %s", (url) => {
    expect(parseVideoUrl(url)).toEqual(YT);
  });

  it.each([
    "https://www.tiktok.com/@chipchip/video/7231338487075638570",
    "https://tiktok.com/@chipchip/video/7231338487075638570?lang=vi",
    "https://www.tiktok.com/embed/v2/7231338487075638570",
  ])("reads the TikTok id from %s", (url) => {
    expect(parseVideoUrl(url)).toEqual(TT);
  });

  it.each([
    "",
    "not a url",
    "javascript:alert(1)",
    "ftp://youtube.com/watch?v=dQw4w9WgXcQ",
    // Lookalike hosts must not pass on the strength of containing "youtube".
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://evil.test/youtu.be/dQw4w9WgXcQ",
    // Wrong id shapes.
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQextra",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/channel/UC1234567890",
    "https://www.tiktok.com/@chipchip/video/abc",
    "https://www.tiktok.com/@chipchip",
  ])("rejects %s", (url) => {
    expect(parseVideoUrl(url)).toBeNull();
  });
});

describe("embedUrl", () => {
  it("embeds YouTube through the no-cookie domain", () => {
    expect(embedUrl(YT)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("embeds TikTok through its v2 player", () => {
    expect(embedUrl(TT)).toBe("https://www.tiktok.com/embed/v2/7231338487075638570");
  });

  it("round-trips: an embed URL parses back to the same reference", () => {
    expect(parseVideoUrl(embedUrl(YT))).toEqual(YT);
    expect(parseVideoUrl(embedUrl(TT))).toEqual(TT);
  });
});

describe("videoRefFrom", () => {
  it("accepts what parseVideoUrl could produce", () => {
    expect(videoRefFrom("youtube", "dQw4w9WgXcQ")).toEqual(YT);
    expect(videoRefFrom("tiktok", "7231338487075638570")).toEqual(TT);
  });

  it.each([
    ["youtube", "dQw4w9WgXc"],
    ["youtube", 'dQw4w9WgXcQ"'],
    ["tiktok", "dQw4w9WgXcQ"],
    ["vimeo", "dQw4w9WgXcQ"],
    ["youtube", 12345678901],
    [undefined, undefined],
  ])("refuses (%s, %s)", (platform, id) => {
    expect(videoRefFrom(platform, id)).toBeNull();
  });
});

describe("watchUrl", () => {
  it("links to the video's own page", () => {
    expect(watchUrl(YT)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(watchUrl(TT)).toBe("https://www.tiktok.com/embed/v2/7231338487075638570");
  });
});
