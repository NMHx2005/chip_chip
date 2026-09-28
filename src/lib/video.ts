/**
 * Video references are stored as (platform, id), never as a URL.
 *
 * Staff paste whatever link the share button gave them; this turns it into
 * the id the database constraint accepts, and `embedUrl` builds the iframe
 * address back from it. Hosts are matched exactly, so a lookalike such as
 * `youtube.com.evil.test` is refused rather than embedded.
 *
 * No server-only imports: the editor (a client component) previews with it.
 */

export type VideoPlatform = "youtube" | "tiktok";
export type VideoRef = { platform: VideoPlatform; externalId: string };

// Must match posts_video_external_id_format in the migration.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^[0-9]{8,25}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);

function youtubeId(url: URL, segments: string[]): string | null {
  if (url.hostname === "youtu.be") return segments[0] ?? null;
  if (segments[0] === "watch") return url.searchParams.get("v");
  if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
    return segments[1] ?? null;
  }
  return null;
}

function tiktokId(segments: string[]): string | null {
  // /@user/video/<id>
  const video = segments.indexOf("video");
  if (video >= 0) return segments[video + 1] ?? null;
  // /embed/v2/<id>
  if (segments[0] === "embed") return segments[segments.length - 1] ?? null;
  return null;
}

export function parseVideoUrl(input: string): VideoRef | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    const id = youtubeId(url, segments);
    return id && YOUTUBE_ID.test(id) ? { platform: "youtube", externalId: id } : null;
  }

  if (TIKTOK_HOSTS.has(host)) {
    const id = tiktokId(segments);
    return id && TIKTOK_ID.test(id) ? { platform: "tiktok", externalId: id } : null;
  }

  return null;
}

export function embedUrl(ref: VideoRef): string {
  const id = encodeURIComponent(ref.externalId);
  return ref.platform === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}`
    : `https://www.tiktok.com/embed/v2/${id}`;
}

/**
 * Rebuilds a reference from untrusted parts — an article's JSON or a data
 * attribute in the page — accepting only what `parseVideoUrl` could produce.
 */
export function videoRefFrom(platform: unknown, externalId: unknown): VideoRef | null {
  if (typeof externalId !== "string") return null;
  if (platform === "youtube" && YOUTUBE_ID.test(externalId)) {
    return { platform, externalId };
  }
  if (platform === "tiktok" && TIKTOK_ID.test(externalId)) {
    return { platform, externalId };
  }
  return null;
}

/** Where the no-JavaScript fallback link sends the reader. */
export function watchUrl(ref: VideoRef): string {
  const id = encodeURIComponent(ref.externalId);
  return ref.platform === "youtube"
    ? `https://www.youtube.com/watch?v=${id}`
    : `https://www.tiktok.com/embed/v2/${id}`;
}

export const PLATFORM_LABEL: Record<VideoPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
};
