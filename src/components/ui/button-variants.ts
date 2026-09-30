export type ButtonVariant = "primary" | "secondary" | "onDark";

export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border-border bg-surface text-text hover:border-black/25",
  // For the black panel on the About page.
  onDark: "bg-white text-accent hover:bg-white/90",
};

/**
 * Focus ring per variant: the Tailwind class, plus the colour and the surface it
 * is drawn against so a test can hold the 3:1 rule (WCAG 1.4.11). The accent
 * ring is only 1.87:1 on the black panel, so `onDark` gets a white one.
 */
export const FOCUS_RING: Record<ButtonVariant, { class: string; hex: string; surface: string }> = {
  primary: { class: "focus-visible:outline-accent", hex: "#314344", surface: "#E5E5E5" },
  secondary: { class: "focus-visible:outline-accent", hex: "#314344", surface: "#E5E5E5" },
  onDark: { class: "focus-visible:outline-white", hex: "#FFFFFF", surface: "#0D0D0D" },
};
