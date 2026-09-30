import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import type { Difficulty } from "@/lib/types";

/** Topics are recognised by a number, in the order a newcomer should read them. */
export function topicNumber(topic: TopicId): 1 | 2 | 3 | 4 {
  return (TOPIC_IDS.indexOf(topic) + 1) as 1 | 2 | 3 | 4;
}

/** How many of the three bars a difficulty fills. */
export function difficultyLevel(difficulty: Difficulty): 1 | 2 | 3 {
  return ({ basic: 1, intermediate: 2, advanced: 3 } as const)[difficulty];
}

/**
 * Delay in seconds before a card in a grid fades in (design M3). Staggered by
 * column and restarted every row, so twelve cards never wait in one long queue.
 */
export function revealDelay(index: number, columns = 3): number {
  return Math.round((0.05 + (index % columns) * 0.07) * 100) / 100;
}
