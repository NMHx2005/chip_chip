import { describe, expect, it } from "vitest";
import { TOPIC_IDS } from "@/lib/constants";
import { difficultyLevel, revealDelay, topicNumber } from "@/lib/post-display";

describe("topicNumber", () => {
  it("numbers the four topics 1 to 4 in learning order", () => {
    expect(TOPIC_IDS.map(topicNumber)).toEqual([1, 2, 3, 4]);
  });

  it("starts with the definition topic", () => {
    expect(topicNumber("dinh-nghia")).toBe(1);
    expect(topicNumber("lich-su")).toBe(4);
  });
});

describe("difficultyLevel", () => {
  it("maps the three levels onto one, two and three bars", () => {
    expect(difficultyLevel("basic")).toBe(1);
    expect(difficultyLevel("intermediate")).toBe(2);
    expect(difficultyLevel("advanced")).toBe(3);
  });
});

describe("revealDelay", () => {
  it("staggers by column: 0.05s, 0.12s, 0.19s", () => {
    expect([0, 1, 2].map((i) => revealDelay(i))).toEqual([0.05, 0.12, 0.19]);
  });

  it("restarts every row so a long list does not queue up", () => {
    expect(revealDelay(3)).toBe(0.05);
    expect(revealDelay(11)).toBe(0.19);
  });

  it("does not stagger a single column", () => {
    expect(revealDelay(0, 1)).toBe(0.05);
    expect(revealDelay(7, 1)).toBe(0.05);
  });
});
