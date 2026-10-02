import { describe, expect, it } from "vitest";
import { revisionChanged, type RevisionSnapshot } from "@/lib/revisions";

const base: RevisionSnapshot = {
  title: "Chíp là gì",
  slug: "chip-la-gi",
  excerpt: "Mở đầu",
  coverImageUrl: null,
  content: { type: "doc", content: [{ type: "paragraph" }] },
  status: "draft",
};

describe("revisionChanged", () => {
  it("is false for an identical copy, so a no-op save keeps no history", () => {
    expect(revisionChanged(base, { ...base })).toBe(false);
  });

  it("notices each field it keeps", () => {
    expect(revisionChanged(base, { ...base, title: "Khác" })).toBe(true);
    expect(revisionChanged(base, { ...base, slug: "khac" })).toBe(true);
    expect(revisionChanged(base, { ...base, excerpt: null })).toBe(true);
    expect(revisionChanged(base, { ...base, coverImageUrl: "/x.png" })).toBe(true);
    expect(revisionChanged(base, { ...base, content: { type: "doc", content: [] } })).toBe(true);
    expect(revisionChanged(base, { ...base, status: "published" })).toBe(true);
  });

  it("treats a missing excerpt and an empty one as the same thing", () => {
    expect(revisionChanged({ ...base, excerpt: null }, { ...base, excerpt: "" })).toBe(false);
  });
});
