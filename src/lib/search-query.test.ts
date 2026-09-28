import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH, parseSearchQuery } from "@/lib/search-query";

describe("parseSearchQuery", () => {
  it("is empty when nothing was typed", () => {
    expect(parseSearchQuery(undefined)).toBe("");
    expect(parseSearchQuery("   ")).toBe("");
    expect(parseSearchQuery([])).toBe("");
  });

  it("trims and folds whitespace, keeping accents", () => {
    expect(parseSearchQuery("  bán \n\t dẫn  ")).toBe("bán dẫn");
  });

  it("uses only the first of a repeated q", () => {
    expect(parseSearchQuery(["transistor", "chip"])).toBe("transistor");
  });

  it("cuts at 100 characters without splitting an emoji", () => {
    expect(MAX_QUERY_LENGTH).toBe(100);
    expect(parseSearchQuery("a".repeat(150))).toHaveLength(100);
    const cut = parseSearchQuery(`${"a".repeat(99)}🙂🙂`);
    expect(Array.from(cut)).toHaveLength(100);
    expect(cut.endsWith("🙂")).toBe(true);
  });
});
