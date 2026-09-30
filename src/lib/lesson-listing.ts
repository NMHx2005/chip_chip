import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export type HeroStatKey = "lessons" | "topics" | "levels";

/**
 * The figures in the lessons hero card. The library page shows how many lessons
 * there are, and how many topics and levels they are sorted into; a topic page
 * already has its topic chosen, so it drops that cell.
 */
export function lessonHeroStats(input: {
  total: number;
  topic: TopicId | null;
}): { key: HeroStatKey; value: number }[] {
  const lessons = { key: "lessons" as const, value: input.total };
  const levels = { key: "levels" as const, value: DIFFICULTIES.length };
  return input.topic === null
    ? [lessons, { key: "topics" as const, value: TOPIC_IDS.length }, levels]
    : [lessons, levels];
}

/** Where a newcomer should begin: the first topic, at the easiest level. */
export function startHere(): { topic: TopicId; difficulty: Difficulty } {
  return { topic: TOPIC_IDS[0], difficulty: DIFFICULTIES[0] };
}
