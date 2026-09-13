import type { Variants } from "framer-motion";
import { DURATION, EASE_STANDARD, STAGGER } from "@/components/motion/tokens";

/**
 * Entrance variants, ported from Strike_Robot_LandingPage_Desing.
 *
 * Use as `initial="hidden"` + `whileInView="visible"` with `VIEWPORT_ONCE`.
 * A parent carrying a stagger container propagates the state to children
 * automatically — children only need their own `variants`.
 */

const entrance = (duration: number) => ({
  duration,
  ease: EASE_STANDARD,
});

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: entrance(DURATION.base) },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: entrance(DURATION.reveal) },
};

export const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: entrance(0.65) },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: entrance(DURATION.base) },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: entrance(DURATION.base) },
};

const container = (staggerChildren: number, delayChildren: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

export const staggerContainer = container(STAGGER.step, STAGGER.delay);
export const staggerContainerFast = container(
  STAGGER.fastStep,
  STAGGER.fastDelay
);
export const staggerContainerSlow = container(
  STAGGER.slowStep,
  STAGGER.slowDelay
);

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: entrance(0.55) },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: entrance(DURATION.base) },
};
