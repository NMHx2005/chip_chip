/**
 * Accent-insensitive match ranges, for highlighting search results.
 *
 * Mirrors `search_posts` (supabase/migrations/20260928000200_search.sql): the
 * query is lowercased and unaccented, split on non-alphanumerics into tokens,
 * and a post matches when every token is a *word prefix* in its text. The
 * highlighter applies the same rule, so a result row never marks text the
 * database did not match — a query that only matched `plain_text` (not the
 * title or the excerpt) marks nothing here.
 *
 * Scope: the folding and the token split are ASCII, which is exact for
 * Vietnamese (every accented code point folds to one ASCII letter) but means a
 * non-Latin query (Greek, Cyrillic, CJK) can be searched by the database and
 * still go unmarked here. That direction is safe — a missed mark is invisible,
 * a wrong one is not.
 */

/**
 * One character folded to its match form: diacritics dropped, đ→d, lowercase.
 * NFD + stripping the combining marks handles every Vietnamese vowel; đ/Đ is a
 * letter in its own right and survives NFD, so it is mapped by hand.
 */
function foldChar(char: string): string {
  return char.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();
}

/**
 * Folds `text` and records, for each folded character, the index in the
 * original string of the character it came from. A combining mark produces no
 * folded character, so a match ending before the next base character also
 * swallows that mark — the whole Vietnamese cluster stays inside the range.
 */
export function foldWithMap(text: string): { folded: string; starts: number[] } {
  let folded = "";
  const starts: number[] = [];
  let index = 0;
  for (const char of text) {
    const part = foldChar(char);
    for (let i = 0; i < part.length; i += 1) starts.push(index);
    folded += part;
    index += char.length;
  }
  return { folded, starts };
}

/**
 * The query's match tokens: lowercased, unaccented, split on anything that is
 * not a letter or digit. As in `search_posts`, one-character tokens are dropped
 * — "a:*" would match nearly everything — unless the whole query is one token.
 */
export function searchTokens(query: string): string[] {
  const tokens = foldWithMap(query)
    .folded.split(/[^a-z0-9]+/)
    .filter((token) => token !== "");
  return tokens.length > 1 ? tokens.filter((token) => token.length > 1) : tokens;
}

// A token continues through letters and digits, and through the joiners
// Postgres keeps inside one token: `.` in `asml.com`, `@` in an email, `/` in a
// URL. A hyphen does not continue a token — Postgres indexes `chip-diode` as two.
const CONTINUES = /[a-z0-9.@/]/;

/**
 * Half-open `[start, end)` ranges in `text` to wrap in `<mark>`: one per
 * word-prefix token match, overlaps merged and sorted. Empty when nothing
 * matches.
 */
export function highlightRanges(text: string, tokens: string[]): [number, number][] {
  if (tokens.length === 0) return [];
  const { folded, starts } = foldWithMap(text);
  const ranges: [number, number][] = [];

  for (let i = 0; i < folded.length; i += 1) {
    if (i > 0 && CONTINUES.test(folded[i - 1])) continue;
    for (const token of tokens) {
      if (!folded.startsWith(token, i)) continue;
      const end = i + token.length;
      ranges.push([starts[i], end < folded.length ? starts[end] : text.length]);
    }
  }

  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}
