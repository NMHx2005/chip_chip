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

/**
 * Motion props for CardReveal. The server cannot know the visitor's
 * reduced-motion setting and renders the hidden starting state, so under
 * reduced motion the client must animate to the visible state itself: it
 * cannot swap in a different element and rely on React to patch the
 * server-rendered attributes, which it does not do while hydrating.
 */
export function cardRevealMotion(reduce: boolean | null) {
  if (reduce) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0 },
      whileInView: undefined,
    };
  }
  return {
    initial: { opacity: 0, y: 20 },
    animate: undefined,
    whileInView: { opacity: 1, y: 0 },
  };
}
