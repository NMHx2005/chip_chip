import katex, { type KatexOptions } from "katex";
import { escapeHtml } from "@/lib/html-escape";
import type { Formula } from "@/lib/tiptap/prepare";

/**
 * `trust: false` is what keeps `\href`, `\url`, `\htmlClass` and
 * `\includegraphics` from producing links, classes or images; `maxSize` and
 * `maxExpand` bound what one formula can cost to typeset.
 */
export const KATEX_OPTIONS = {
  throwOnError: false,
  trust: false,
  strict: "ignore",
  maxSize: 20,
  maxExpand: 200,
  output: "htmlAndMathml",
} as const satisfies KatexOptions;

// Exactly what sanitizeArticleHtml leaves of a math node prepared by
// prepareArticle: the index is all the attribute ever holds.
const PLACEHOLDER = /<(span|div) data-latex="(\d+)" data-type="(?:inline|block)-math"><\/\1>/g;

function typeset({ latex, display }: Formula): string {
  try {
    return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: display });
  } catch {
    return `<code class="math-error">${escapeHtml(latex)}</code>`;
  }
}

/** Replaces the sanitised placeholders with KaTeX HTML. Runs after sanitising. */
export function renderMath(html: string, formulas: Formula[]): string {
  return html.replace(PLACEHOLDER, (_match, _tag, index: string) => {
    const formula = formulas[Number(index)];
    if (!formula || !formula.latex.trim()) return "";
    return formula.display
      ? `<div class="math-block">${typeset(formula)}</div>`
      : `<span class="math-inline">${typeset(formula)}</span>`;
  });
}

/** The same placeholders as raw LaTeX, for search text and meta descriptions. */
export function mathToText(html: string, formulas: Formula[]): string {
  return html.replace(PLACEHOLDER, (_match, _tag, index: string) => {
    const formula = formulas[Number(index)];
    return formula ? ` ${escapeHtml(formula.latex)} ` : "";
  });
}
