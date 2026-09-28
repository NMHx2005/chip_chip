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

// KaTeX's parse time grows super-linearly with input length — measured at
// ~87s for a 500,000-character formula — and nothing upstream bounds how
// long a stored formula can be. Longer LaTeX is never handed to KaTeX.
const MAX_LATEX_LENGTH = 2000;

function truncate(latex: string): string {
  return latex.length > 200 ? `${latex.slice(0, 200)}…` : latex;
}

function errorMarkup(latex: string): string {
  return `<code class="math-error">${escapeHtml(truncate(latex))}</code>`;
}

function typeset({ latex, display }: Formula): string {
  if (latex.length > MAX_LATEX_LENGTH) return errorMarkup(latex);
  try {
    return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: display });
  } catch {
    return errorMarkup(latex);
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
    return formula ? ` ${escapeHtml(truncate(formula.latex))} ` : "";
  });
}
