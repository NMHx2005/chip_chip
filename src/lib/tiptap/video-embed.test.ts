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
});
