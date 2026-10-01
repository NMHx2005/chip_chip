import { describe, expect, it } from "vitest";
import { renderVideos, videoFacadeHtml } from "@/lib/tiptap/video-embed";

describe("videoFacadeHtml", () => {
  it("is the same facade an article renders, so the video page reuses its player", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    const placeholder = '<div data-type="video" data-platform="youtube" data-external-id="dQw4w9WgXcQ"></div>';

    expect(videoFacadeHtml(ref, "en")).toBe(renderVideos(placeholder, "en"));
    expect(videoFacadeHtml(ref, "en")).toContain('aria-label="Play video on YouTube"');
    expect(videoFacadeHtml(ref, "en")).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
  });

  it("draws a TikTok facade without a thumbnail", () => {
    const html = videoFacadeHtml({ platform: "tiktok", externalId: "7231338487075638570" }, "vi");
    expect(html).toContain('class="video-embed video-embed-tiktok"');
    expect(html).toContain('aria-label="Phát video trên TikTok"');
    expect(html).not.toContain("<img");
  });

  it("lazy-loads the thumbnail by default", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    expect(videoFacadeHtml(ref, "en")).toContain('loading="lazy"');
  });

  it("loads the thumbnail eagerly and at high priority when asked to", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    const html = videoFacadeHtml(ref, "en", { eager: true });
    expect(html).toContain('loading="eager" fetchpriority="high"');
    expect(html).not.toContain('loading="lazy"');
  });

  it("adds the large modifier to the figure and nothing else", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    const base = videoFacadeHtml(ref, "en");
    const large = videoFacadeHtml(ref, "en", { large: true });

    expect(base).not.toContain("video-embed-lg");
    expect(large).toBe(
      base.replace(
        'class="video-embed video-embed-youtube"',
        'class="video-embed video-embed-youtube video-embed-lg"'
      )
    );
  });

  it("names the video in the label when given a title", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    const html = videoFacadeHtml(ref, "vi", { large: true, title: "Vì sao chip nóng" });

    expect(html).toContain('aria-label="Phát video: Vì sao chip nóng (YouTube)"');
  });

  it("inserts the title literally, even with $ patterns or a {platform} token", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    const html = videoFacadeHtml(ref, "vi", {
      large: true,
      title: "Giá $& và {platform} trong chip",
    });

    expect(html).toContain(
      'aria-label="Phát video: Giá $&amp; và {platform} trong chip (YouTube)"'
    );
  });
});
