import type { VideoSort } from "@/lib/listing-params";

/** Cards per listing page, lessons and videos alike. */
export const LISTING_PAGE_SIZE = 12;

/** One `.order()` call, in the order they must be applied. */
export type OrderClause = {
  column: "published_at" | "difficulty" | "id";
  ascending: boolean;
  nullsFirst: boolean;
};

const NEWEST: OrderClause = { column: "published_at", ascending: false, nullsFirst: false };
// Two posts published in the same instant would otherwise swap places between
// requests and show up on two pages, or on none.
const TIE_BREAK: OrderClause = { column: "id", ascending: true, nullsFirst: false };

/**
 * The ORDER BY behind each sort. Lessons always use "newest"; videos let the
 * reader choose.
 *
 * `difficulty` is the Postgres enum `post_difficulty`, which sorts in its
 * declared order (basic, intermediate, advanced) rather than alphabetically,
 * so ascending really is easiest first. A video without a difficulty goes
 * last in both directions, then newest first within each level.
 */
export function listingOrder(sort: VideoSort): OrderClause[] {
  switch (sort) {
    case "oldest":
      return [{ column: "published_at", ascending: true, nullsFirst: false }, TIE_BREAK];
    case "easiest":
      return [{ column: "difficulty", ascending: true, nullsFirst: false }, NEWEST, TIE_BREAK];
    case "hardest":
      return [{ column: "difficulty", ascending: false, nullsFirst: false }, NEWEST, TIE_BREAK];
    case "newest":
      return [NEWEST, TIE_BREAK];
  }
}

/** The inclusive row range of a 1-based page, as `.range()` takes it. */
export function pageRange(page: number, pageSize = LISTING_PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}
