import { Node } from "@tiptap/core";

export const CALLOUT_VARIANTS = ["note", "tip", "warning", "example"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

/** Anything outside the list — a hand-edited row, a pasted attribute — is a note. */
export function calloutVariant(value: unknown): CalloutVariant {
  return CALLOUT_VARIANTS.find((variant) => variant === value) ?? "note";
}

/**
 * A boxed aside. The label ("Ghi chú" / "Note", …) is drawn by CSS from
 * `data-variant` and the page language, so it never has to be translated
 * inside the article.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "note",
        rendered: false,
        parseHTML: (element) => calloutVariant(element.getAttribute("data-variant")),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-variant]" }];
  },

  renderHTML({ node }) {
    const variant = calloutVariant(node.attrs.variant);
    return ["aside", { class: `callout callout-${variant}`, "data-variant": variant }, 0];
  },
});
