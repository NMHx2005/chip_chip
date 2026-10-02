import type { Editor } from "@tiptap/react";

export type MathKind = "inline" | "block";

/** What the prompt asks for; the kind decides the wording. */
export const MATH_LABEL: Record<MathKind, string> = {
  inline: "Công thức LaTeX (trong dòng)",
  block: "Công thức LaTeX (khối riêng)",
};

/** Where a formula already in the document lives, when one was clicked. */
export type ExistingMath = { latex: string; pos: number };

/**
 * Inserts, updates or (when emptied) removes a formula.
 *
 * Asking for the LaTeX is the caller's job — the editor toolbar and the
 * click-a-formula handler both put the question in a dialog — so this only
 * touches the document.
 */
export function applyMath(
  editor: Editor,
  kind: MathKind,
  input: string,
  existing?: ExistingMath
) {
  const latex = input.trim();

  if (!existing) {
    if (!latex) return;
    if (kind === "inline") editor.chain().focus().insertInlineMath({ latex }).run();
    else editor.chain().focus().insertBlockMath({ latex }).run();
    return;
  }

  const { pos } = existing;
  if (kind === "inline") {
    if (latex) editor.chain().focus().updateInlineMath({ latex, pos }).run();
    else editor.chain().focus().deleteInlineMath({ pos }).run();
  } else if (latex) {
    editor.chain().focus().updateBlockMath({ latex, pos }).run();
  } else {
    editor.chain().focus().deleteBlockMath({ pos }).run();
  }
}
