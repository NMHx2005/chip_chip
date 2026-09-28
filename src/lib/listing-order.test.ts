import { describe, expect, it } from "vitest";
import { LISTING_PAGE_SIZE, pageRange, listingOrder } from "@/lib/listing-order";

describe("listingOrder", () => {
  it("sorts newest first by default", () => {
    expect(listingOrder("newest")).toEqual([
      { column: "published_at", ascending: false, nullsFirst: false },
      { column: "id", ascending: true, nullsFirst: false },
    ]);
  });

  it("sorts oldest first", () => {
    expect(listingOrder("oldest")[0]).toEqual({ column: "published_at", ascending: true, nullsFirst: false });
  });

  it("sorts easiest first by the enum order, videos without a level last, then newest", () => {
    expect(listingOrder("easiest")).toEqual([
      { column: "difficulty", ascending: true, nullsFirst: false },
      { column: "published_at", ascending: false, nullsFirst: false },
      { column: "id", ascending: true, nullsFirst: false },
    ]);
  });

  it("sorts hardest first, still with videos without a level last", () => {
    expect(listingOrder("hardest").slice(0, 2)).toEqual([
      { column: "difficulty", ascending: false, nullsFirst: false },
      { column: "published_at", ascending: false, nullsFirst: false },
    ]);
  });

  it("always ends on a unique column so pages never overlap", () => {
    for (const sort of ["newest", "oldest", "easiest", "hardest"] as const) {
      expect(listingOrder(sort).at(-1)?.column).toBe("id");
    }
  });
});

describe("pageRange", () => {
  it("maps a 1-based page to an inclusive range of 12 rows", () => {
    expect(LISTING_PAGE_SIZE).toBe(12);
    expect(pageRange(1)).toEqual({ from: 0, to: 11 });
    expect(pageRange(3)).toEqual({ from: 24, to: 35 });
    expect(pageRange(2, 5)).toEqual({ from: 5, to: 9 });
  });
});
