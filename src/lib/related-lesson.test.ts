import { describe, expect, it } from "vitest";
import { toRelatedLesson } from "@/lib/related-lesson";

const valid = {
  slug: "transistor-la-gi",
  topic: "dinh-nghia",
  title: "Transistor là gì?",
  excerpt: "Một lời giải thích ngắn.",
  difficulty: "basic",
  published_at: "2026-09-01T00:00:00Z",
};

describe("toRelatedLesson", () => {
  it("returns null for a missing row", () => {
    expect(toRelatedLesson(null)).toBeNull();
  });

  it("returns null when the topic is missing or unknown", () => {
    expect(toRelatedLesson({ ...valid, topic: null })).toBeNull();
    expect(toRelatedLesson({ ...valid, topic: "khong-co" })).toBeNull();
  });

  it("maps every field of a valid row", () => {
    expect(toRelatedLesson(valid)).toEqual({
      slug: "transistor-la-gi",
      topic: "dinh-nghia",
      title: "Transistor là gì?",
      excerpt: "Một lời giải thích ngắn.",
      difficulty: "basic",
      publishedAt: "2026-09-01T00:00:00Z",
    });
  });

  it("turns an empty or non-string excerpt into null", () => {
    expect(toRelatedLesson({ ...valid, excerpt: "" })?.excerpt).toBeNull();
    expect(toRelatedLesson({ ...valid, excerpt: 42 })?.excerpt).toBeNull();
    expect(toRelatedLesson({ ...valid, excerpt: null })?.excerpt).toBeNull();
  });

  it("turns an unknown difficulty into null", () => {
    expect(toRelatedLesson({ ...valid, difficulty: "expert" })?.difficulty).toBeNull();
    expect(toRelatedLesson({ ...valid, difficulty: null })?.difficulty).toBeNull();
  });

  it("turns a non-string date into null", () => {
    expect(toRelatedLesson({ ...valid, published_at: 123 })?.publishedAt).toBeNull();
  });
});
