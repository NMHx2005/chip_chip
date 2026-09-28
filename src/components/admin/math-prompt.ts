import type { Editor } from "@tiptap/react";

export type MathKind = "inline" | "block";

/**
 * Asks for LaTeX and inserts, updates or (when emptied) removes a formula.
 *
 * `existing` is set when the writer clicked a formula already in the text.
 */
export function promptMath(
  editor: Editor,
  kind: MathKind,
  existing?: { latex: string; pos: number }
) {
  const input = window.prompt(
    kind === "inline" ? "Công thức LaTeX (trong dòng):" : "Công thức LaTeX (khối riêng):",
    existing?.latex ?? ""
  );
  if (input === null) return;
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
