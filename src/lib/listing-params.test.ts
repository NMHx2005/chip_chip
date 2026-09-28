import { describe, expect, it } from "vitest";
import {
  DEFAULT_LISTING,
  listingQuery,
  parseListingParams,
  type ListingParams,
} from "@/lib/listing-params";

describe("parseListingParams", () => {
  it("returns the defaults for an empty URL", () => {
    expect(parseListingParams({})).toEqual(DEFAULT_LISTING);
  });

  it("keeps every valid value", () => {
    expect(
      parseListingParams({
        topic: "nguyen-ly",
        difficulty: "advanced",
        platform: "tiktok",
        source: "curated",
        sort: "hardest",
        page: "3",
      })
    ).toEqual({
      topic: "nguyen-ly",
      difficulty: "advanced",
      platform: "tiktok",
      source: "curated",
      sort: "hardest",
      page: 3,
    });
  });

  it("drops values that are not on the whitelist", () => {
    expect(
      parseListingParams({
        topic: "khong-co",
        difficulty: "Advanced",
        platform: "vimeo",
        source: "<script>",
        sort: "random",
        page: "2",
      })
    ).toEqual({ ...DEFAULT_LISTING, page: 2 });
  });

  it("reads page 1 for anything but an integer from 1 to 500", () => {
    for (const page of ["0", "-1", "501", "1000", "1.5", "2e2", " 2", "02", "abc", ""]) {
      expect(parseListingParams({ page }).page).toBe(1);
    }
    expect(parseListingParams({ page: "500" }).page).toBe(500);
    expect(parseListingParams({ page: "1" }).page).toBe(1);
  });

  it("uses only the first of a repeated parameter", () => {
    expect(parseListingParams({ difficulty: ["advanced", "basic"] }).difficulty).toBe("advanced");
    expect(parseListingParams({ difficulty: ["bogus", "basic"] }).difficulty).toBeNull();
    expect(parseListingParams({ page: ["4", "9"] }).page).toBe(4);
    expect(parseListingParams({ sort: [] }).sort).toBe("newest");
  });
});

describe("listingQuery", () => {
  const current: ListingParams = {
    topic: "ung-dung",
    difficulty: "basic",
    platform: "youtube",
    source: "own",
    sort: "oldest",
    page: 4,
  };

  it("leaves defaults out so each view has one URL", () => {
    expect(listingQuery(DEFAULT_LISTING)).toEqual({});
  });

  it("keeps the other filters when one changes, and goes back to page 1", () => {
    expect(listingQuery(current, { difficulty: "advanced" })).toEqual({
      topic: "ung-dung",
      difficulty: "advanced",
      platform: "youtube",
      source: "own",
      sort: "oldest",
    });
  });

  it("clears one filter with null", () => {
    expect(listingQuery(current, { platform: null, page: 4 })).toEqual({
      topic: "ung-dung",
      difficulty: "basic",
      source: "own",
      sort: "oldest",
      page: "4",
    });
  });

  it("moves to another page without touching the filters", () => {
    expect(listingQuery(current, { page: 5 })).toMatchObject({ page: "5", sort: "oldest" });
  });
});
