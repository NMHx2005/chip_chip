import type { ReactNode } from "react";
import { highlightRanges, searchTokens } from "@/lib/search-highlight";

/**
 * `text` with the words the query matched wrapped in `<mark>`. The ranges come
 * from the same rule `search_posts` uses (see search-highlight.ts), so a row
 * never marks text the database did not match.
 */
export function Mark({ text, query }: { text: string; query: string }) {
  const ranges = highlightRanges(text, searchTokens(query));
  if (ranges.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={index} className="rounded-[3px] bg-[#FEF6D9] px-0.5 font-semibold text-inherit">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
