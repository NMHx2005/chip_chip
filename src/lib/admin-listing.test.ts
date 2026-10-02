import { describe, expect, it } from "vitest";
import {
  ADMIN_PAGE_SIZE,
  adminListHref,
  adminOffset,
  adminPageCount,
  parseAdminSearch,
} from "@/lib/admin-listing";

describe("parseAdminSearch", () => {
  it("trims, and reads nothing as no filter", () => {
    expect(parseAdminSearch(undefined)).toBe("");
    expect(parseAdminSearch("   ")).toBe("");
    expect(parseAdminSearch("  chip  ")).toBe("chip");
  });

  it("takes the first of a repeated parameter", () => {
    expect(parseAdminSearch(["first", "second"])).toBe("first");
  });

  it("caps a very long search", () => {
    expect(parseAdminSearch("x".repeat(200))).toHaveLength(80);
  });
});

describe("adminPageCount", () => {
  it("never reports fewer than one page", () => {
    expect(adminPageCount(0)).toBe(1);
    expect(adminPageCount(1)).toBe(1);
  });

  it("rounds up", () => {
    expect(adminPageCount(ADMIN_PAGE_SIZE)).toBe(1);
    expect(adminPageCount(ADMIN_PAGE_SIZE + 1)).toBe(2);
    expect(adminPageCount(41)).toBe(3);
  });
});

describe("adminOffset", () => {
  it("skips nothing on the first page", () => {
    expect(adminOffset(1)).toBe(0);
    expect(adminOffset(2)).toBe(ADMIN_PAGE_SIZE);
    expect(adminOffset(3, 10)).toBe(20);
  });
});

describe("adminListHref", () => {
  it("leaves the defaults out", () => {
    expect(adminListHref("/admin/bai-viet")).toBe("/admin/bai-viet");
    expect(adminListHref("/admin/bai-viet", { page: 1 })).toBe("/admin/bai-viet");
    expect(adminListHref("/admin/tin-nhan", { filter: "" })).toBe("/admin/tin-nhan");
  });

  it("keeps the search and the page", () => {
    expect(adminListHref("/admin/bai-viet", { q: "chip", page: 3 })).toBe(
      "/admin/bai-viet?q=chip&page=3"
    );
  });

  it("encodes a search safely and keeps a stable order", () => {
    expect(adminListHref("/admin/tin-nhan", { filter: "all", q: "a b", page: 2 })).toBe(
      "/admin/tin-nhan?filter=all&q=a+b&page=2"
    );
  });
});
