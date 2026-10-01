import { describe, expect, it } from "vitest";
import { foldWithMap, highlightRanges, searchTokens } from "@/lib/search-highlight";

describe("searchTokens", () => {
  it("lowercases, unaccents and splits on non-alphanumerics", () => {
    expect(searchTokens("Ban Dan")).toEqual(["ban", "dan"]);
    expect(searchTokens("transistor, diode!")).toEqual(["transistor", "diode"]);
  });

  it("drops one-character tokens unless the query is a single token", () => {
    expect(searchTokens("a b")).toEqual([]);
    expect(searchTokens("a")).toEqual(["a"]);
  });

  it("is empty for a blank query", () => {
    expect(searchTokens("   ")).toEqual([]);
  });
});

describe("foldWithMap", () => {
  it("maps each folded character back to its original index", () => {
    const { folded, starts } = foldWithMap("bán");
    expect(folded).toBe("ban");
    expect(starts).toEqual([0, 1, 2]);
  });

  it("keeps a decomposed cluster mapped to its base character", () => {
    const { folded, starts } = foldWithMap("e\u0302\u0301");
    expect(folded).toBe("e");
    expect(starts).toEqual([0]);
  });
});

describe("highlightRanges", () => {
  it("marks an accent-insensitive phrase", () => {
    expect(highlightRanges("bán dẫn", searchTokens("ban dan"))).toEqual([
      [0, 3],
      [4, 7],
    ]);
  });

  it("marks only the matched prefix of a word", () => {
    expect(highlightRanges("transistor", searchTokens("transis"))).toEqual([[0, 7]]);
  });

  it("is case-insensitive", () => {
    expect(highlightRanges("Transistor", searchTokens("transistor"))).toEqual([[0, 10]]);
  });

  it("does not mark a match that is not a word start", () => {
    expect(highlightRanges("transistor", searchTokens("sistor"))).toEqual([]);
  });

  it("merges overlapping matches", () => {
    expect(highlightRanges("abc", ["a", "ab"])).toEqual([[0, 2]]);
  });

  it("covers a whole decomposed cluster", () => {
    expect(highlightRanges("e\u0302\u0301 x", searchTokens("e"))).toEqual([[0, 3]]);
  });

  it("returns nothing when the text does not match", () => {
    expect(highlightRanges("hello", searchTokens("xyz"))).toEqual([]);
  });
});
