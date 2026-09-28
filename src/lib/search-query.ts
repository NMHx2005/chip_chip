/** Longest search the site sends to the database; search_posts cuts there too. */
export const MAX_QUERY_LENGTH = 100;

/**
 * Normalizes `?q=`: first value only, runs of whitespace folded to one space,
 * trimmed, and cut to MAX_QUERY_LENGTH characters. Cut by code point, not by
 * UTF-16 unit, so an emoji at the boundary is never split in half.
 */
export function parseSearchQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const folded = (raw ?? "").replace(/\s+/g, " ").trim();
  return Array.from(folded).slice(0, MAX_QUERY_LENGTH).join("").trim();
}
