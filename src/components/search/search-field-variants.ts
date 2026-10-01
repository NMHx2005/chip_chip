export type SearchFieldVariant = "light" | "dark";

/**
 * The hint line under the field, per variant, with the surface it is drawn on.
 * A test holds each pair to 4.5:1 (WCAG AA) — the dark one is the mobile
 * drawer's `bg-primary`, where the muted ink the light variant uses is unreadable.
 */
export const HINT_COLORS: Record<
  SearchFieldVariant,
  { class: string; hex: string; surface: string }
> = {
  light: { class: "text-text-muted", hex: "#3E424D", surface: "#E5E5E5" },
  dark: { class: "text-white/70", hex: "#B6B6B6", surface: "#0D0D0D" },
};
