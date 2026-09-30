/**
 * The heading the reader is on: the last one whose top has reached `offset`
 * (the fixed navbar's height plus a little). Above the first heading the first
 * one is returned, so the rail always has an active row.
 */
export function pickActiveHeading(
  tops: { id: string; top: number }[],
  offset: number
): string | null {
  if (tops.length === 0) return null;
  const sorted = [...tops].sort((a, b) => a.top - b.top);
  let active = sorted[0].id;
  for (const heading of sorted) {
    if (heading.top <= offset) active = heading.id;
    else break;
  }
  return active;
}
