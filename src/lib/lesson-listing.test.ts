import { describe, expect, it } from "vitest";
import { TOPIC_IDS } from "@/lib/constants";
import { lessonHeroStats, startHere } from "@/lib/lesson-listing";
import { DIFFICULTIES } from "@/lib/types";

describe("lessonHeroStats", () => {
  it("shows lessons, topics and levels on the library page", () => {
    expect(lessonHeroStats({ total: 47, topic: null })).toEqual([
      { key: "lessons", value: 47 },
      { key: "topics", value: 4 },
      { key: "levels", value: 3 },
    ]);
  });

  it("drops the topics cell on a topic page, where the topic is already chosen", () => {
    expect(lessonHeroStats({ total: 12, topic: "dinh-nghia" })).toEqual([
      { key: "lessons", value: 12 },
      { key: "levels", value: 3 },
    ]);
  });

  it("still reports an empty library", () => {
    expect(lessonHeroStats({ total: 0, topic: null })[0]).toEqual({ key: "lessons", value: 0 });
  });

  it("derives topics and levels from the real lists, not from literals", () => {
    const stats = lessonHeroStats({ total: 1, topic: null });
    expect(stats.find((s) => s.key === "topics")?.value).toBe(TOPIC_IDS.length);
    expect(stats.find((s) => s.key === "levels")?.value).toBe(DIFFICULTIES.length);
  });
});

describe("startHere", () => {
  it("points a newcomer at the first topic and the easiest level", () => {
    expect(startHere()).toEqual({ topic: "dinh-nghia", difficulty: "basic" });
    expect(startHere().topic).toBe(TOPIC_IDS[0]);
    expect(startHere().difficulty).toBe(DIFFICULTIES[0]);
  });
});
