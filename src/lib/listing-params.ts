import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type VideoSource } from "@/lib/types";
import type { VideoPlatform } from "@/lib/video";

/** `searchParams` as Next hands it to a page. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const VIDEO_SORTS = ["newest", "oldest", "easiest", "hardest"] as const;
export type VideoSort = (typeof VIDEO_SORTS)[number];

export const VIDEO_PLATFORMS: readonly VideoPlatform[] = ["youtube", "tiktok"];
export const VIDEO_SOURCES: readonly VideoSource[] = ["own", "curated"];

/** Highest `?page=` a listing accepts; anything above reads as page 1. */
export const MAX_PAGE = 500;

/** Every filter a listing URL can carry, already validated. */
export type ListingParams = {
  topic: TopicId | null;
  difficulty: Difficulty | null;
  platform: VideoPlatform | null;
  source: VideoSource | null;
  sort: VideoSort;
  page: number;
};

export const DEFAULT_LISTING: ListingParams = {
  topic: null,
  difficulty: null,
  platform: null,
  source: null,
  sort: "newest",
  page: 1,
};

/** A repeated parameter (`?a=1&a=2`) arrives as an array; the first one wins. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pick<T extends string>(allowed: readonly T[], value: string | undefined): T | null {
  return allowed.find((option) => option === value) ?? null;
}

const PAGE = /^[1-9][0-9]{0,2}$/;

/**
 * Reads `?page=` for any paged list: a plain integer from 1 to MAX_PAGE.
 * Anything else — missing, negative, text, or a stale link past the end —
 * reads as page 1, which bounds how far `.range()` can be pushed.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = firstParam(value);
  if (raw === undefined || !PAGE.test(raw)) return 1;
  const page = Number(raw);
  return page <= MAX_PAGE ? page : 1;
}

/**
 * Reads a listing's filters from the URL.
 *
 * Everything is matched against a whitelist, so a value the app does not know
 * is dropped instead of reaching a query.
 */
export function parseListingParams(searchParams: SearchParams): ListingParams {
  return {
    topic: pick(TOPIC_IDS, firstParam(searchParams.topic)),
    difficulty: pick(DIFFICULTIES, firstParam(searchParams.difficulty)),
    platform: pick(VIDEO_PLATFORMS, firstParam(searchParams.platform)),
    source: pick(VIDEO_SOURCES, firstParam(searchParams.source)),
    sort: pick(VIDEO_SORTS, firstParam(searchParams.sort)) ?? "newest",
    page: parsePageParam(searchParams.page),
  };
}

/**
 * The query string of `current` with `change` applied.
 *
 * Defaults are left out so each view has exactly one URL, and any change that
 * does not name a page sends the reader back to page 1 — page 3 of the old
 * filter means nothing under the new one.
 */
export function listingQuery(
  current: ListingParams,
  change: Partial<ListingParams> = {}
): Record<string, string> {
  const next: ListingParams = { ...current, page: 1, ...change };
  const query: Record<string, string> = {};
  if (next.topic) query.topic = next.topic;
  if (next.difficulty) query.difficulty = next.difficulty;
  if (next.platform) query.platform = next.platform;
  if (next.source) query.source = next.source;
  if (next.sort !== "newest") query.sort = next.sort;
  if (next.page > 1) query.page = String(next.page);
  return query;
}

/**
 * Which page numbers a pagination bar shows: all of them up to seven pages,
 * otherwise the first, the last and the neighbours of the current page, with
 * a "gap" wherever numbers are skipped. A page past the end (a stale link)
 * still gets a bar that leads back into range.
 */
export function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const shown = [1, page - 1, page, page + 1, totalPages]
    .filter((n) => n >= 1 && n <= totalPages)
    .filter((n, i, all) => all.indexOf(n) === i)
    .sort((a, b) => a - b);

  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? ["gap" as const, n] : [n]));
}
