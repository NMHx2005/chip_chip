import type { Locale } from "@/i18n/routing";
import { escapeHtml } from "@/lib/html-escape";
import { PLATFORM_LABEL, thumbnailUrl, videoRefFrom, watchUrl, type VideoRef } from "@/lib/video";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/**
 * Swaps sanitised video placeholders for a click-to-load facade.
 *
 * No iframe is ever part of the HTML: the facade is a plain link to the video
 * (so it works without JavaScript), and VideoFacades replaces it with the
 * player only when the reader asks for it. That keeps YouTube/TikTok from
 * loading — or setting cookies — for readers who never press play.
 *
 * This module runs outside the component tree (see render.ts), so it cannot
 * call `useTranslations`/`getTranslations`. Its one string is read straight
 * out of the message catalogues and interpolated by hand, keyed by the locale
 * threaded down from the page.
 */

const PLACEHOLDER =
  /<div data-type="video" data-platform="([a-z]*)" data-external-id="([A-Za-z0-9_-]*)"><\/div>/g;

// Anything prepareArticle let through but this pattern does not match.
const LEFTOVER = /<div data-type="video"[^>]*><\/div>/g;

const PLAY_VIDEO: Record<Locale, string> = { vi: vi.forum.playVideo, en: en.forum.playVideo };

/**
 * The click-to-load facade for one validated video. Exported for the video
 * page, which shows the same player as an article does; the markup is built
 * only from a VideoRef, so it is safe to inject.
 */
export function videoFacadeHtml(ref: VideoRef, locale: Locale): string {
  const id = escapeHtml(ref.externalId);
  const label = PLATFORM_LABEL[ref.platform];
  const ariaLabel = escapeHtml(PLAY_VIDEO[locale].replace("{platform}", label));
  const still = thumbnailUrl(ref);
  const thumbnail = still
    ? `<img src="${escapeHtml(still)}" alt="" loading="lazy" decoding="async">`
    : "";
  return (
    `<figure class="video-embed video-embed-${ref.platform}">` +
    `<a class="video-facade" href="${escapeHtml(watchUrl(ref))}" target="_blank" rel="noopener noreferrer" ` +
    `aria-label="${ariaLabel}" data-video-platform="${ref.platform}" data-video-id="${id}">` +
    thumbnail +
    `<span class="video-facade-play" aria-hidden="true"></span>` +
    `<span class="video-facade-label">${label}</span>` +
    `</a></figure>`
  );
}

export function renderVideos(html: string, locale: Locale): string {
  return html
    .replace(PLACEHOLDER, (_match, platform: string, externalId: string) => {
      const ref = videoRefFrom(platform, externalId);
      return ref ? videoFacadeHtml(ref, locale) : "";
    })
    .replace(LEFTOVER, "");
}

/** Videos contribute nothing to search text. */
export function videosToText(html: string): string {
  return html.replace(PLACEHOLDER, "").replace(LEFTOVER, "");
}
