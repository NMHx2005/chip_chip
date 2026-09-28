import { escapeHtml } from "@/lib/html-escape";
import { PLATFORM_LABEL, videoRefFrom, watchUrl, type VideoRef } from "@/lib/video";

/**
 * Swaps sanitised video placeholders for a click-to-load facade.
 *
 * No iframe is ever part of the HTML: the facade is a plain link to the video
 * (so it works without JavaScript), and VideoFacades replaces it with the
 * player only when the reader asks for it. That keeps YouTube/TikTok from
 * loading — or setting cookies — for readers who never press play.
 */

const PLACEHOLDER =
  /<div data-type="video" data-platform="([a-z]*)" data-external-id="([A-Za-z0-9_-]*)"><\/div>/g;

// Anything prepareArticle let through but this pattern does not match.
const LEFTOVER = /<div data-type="video"[^>]*><\/div>/g;

function facade(ref: VideoRef): string {
  const id = escapeHtml(ref.externalId);
  const label = PLATFORM_LABEL[ref.platform];
  const thumbnail =
    ref.platform === "youtube"
      ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">`
      : "";
  return (
    `<figure class="video-embed video-embed-${ref.platform}">` +
    `<a class="video-facade" href="${escapeHtml(watchUrl(ref))}" target="_blank" rel="noopener noreferrer" ` +
    `data-video-platform="${ref.platform}" data-video-id="${id}">` +
    thumbnail +
    `<span class="video-facade-play" aria-hidden="true"></span>` +
    `<span class="video-facade-label">${label}</span>` +
    `</a></figure>`
  );
}

export function renderVideos(html: string): string {
  return html
    .replace(PLACEHOLDER, (_match, platform: string, externalId: string) => {
      const ref = videoRefFrom(platform, externalId);
      return ref ? facade(ref) : "";
    })
    .replace(LEFTOVER, "");
}

/** Videos contribute nothing to search text. */
export function videosToText(html: string): string {
  return html.replace(PLACEHOLDER, "").replace(LEFTOVER, "");
}
