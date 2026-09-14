/**
 * Single import surface for the motion system.
 *
 * Consumers should reach for `@/components/motion` rather than individual
 * files, so a later reshuffle inside this folder does not ripple outwards.
 */
export * from "@/components/motion/tokens";
export * from "@/components/motion/variants";
export * from "@/components/motion/letterDance";
export * from "@/components/motion/fillProgress";
export * from "@/components/motion/holdToReveal";

export { AnimatedSection } from "@/components/motion/AnimatedSection";
export { AnimatedButtonLabel } from "@/components/motion/AnimatedButtonLabel";
export { ScrollReveal3D } from "@/components/motion/ScrollReveal3D";
export { SceneFillOverlay } from "@/components/motion/SceneFillOverlay";
export { StickyBackdrop } from "@/components/motion/StickyBackdrop";
export { MainSection } from "@/components/motion/MainSection";
export { TiltCard } from "@/components/motion/TiltCard";
export { DriftTextPath } from "@/components/motion/DriftTextPath";
export { useHoldToReveal } from "@/components/motion/useHoldToReveal";
export { useSharedScrollProgress } from "@/components/motion/useSharedScrollProgress";
export { VideoHoverCard } from "@/components/motion/VideoHoverCard";
export { useVideoHoverCard } from "@/components/motion/useVideoHoverCard";
