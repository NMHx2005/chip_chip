import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";

describe("home.topics.articleCount", () => {
  it("uses ICU plural so one article is singular", () => {
    const phrase = en.home.topics.articleCount;

    expect(phrase).toContain("plural");
    expect(phrase).toMatch(/one \{[^}]*article\}/);
    expect(phrase).toMatch(/other \{[^}]*articles\}/);
  });
});
