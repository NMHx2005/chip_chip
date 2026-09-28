import "server-only";

import { generateHTML } from "@tiptap/html";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { extractHeadings, withHeadingIds } from "@/lib/tiptap/headings";
import { mathToText, renderMath } from "@/lib/tiptap/math";
import { prepareArticle, type Formula } from "@/lib/tiptap/prepare";
import { sanitizeArticleHtml } from "@/lib/tiptap/sanitize";
import { renderVideos, videosToText } from "@/lib/tiptap/video-embed";

/**
 * Stored Tiptap JSON to sanitised HTML, with formula and video placeholders
 * still in place.
 *
 * Content is stored as JSON rather than HTML so nothing executable is ever
 * persisted. `generateHTML` runs in Node without a DOM (it uses zeed-dom
 * internally), and `sanitizeArticleHtml` then runs as a second line of
 * defence — only staff can write articles, but sanitising on the way out is
 * cheap insurance against a hand-edited database row or a future importer.
 *
 * Heading ids are injected after sanitising: the sanitiser escapes `<` inside
 * attribute values, so an alt text containing "<h2>" can no longer be
 * mistaken for a heading and shift every anchor after it.
 */
function renderSanitized(content: unknown): { html: string; formulas: Formula[] } | null {
  const prepared = prepareArticle(content);
  if (!prepared) return null;

  let raw: string;
  try {
    raw = generateHTML(
      prepared.doc as Parameters<typeof generateHTML>[0],
      articleExtensions
    );
  } catch {
    // Malformed JSON in the column — render nothing rather than a 500.
    return null;
  }

  const html = withHeadingIds(sanitizeArticleHtml(raw), extractHeadings(content));
  return { html, formulas: prepared.formulas };
}

/**
 * Renders stored Tiptap JSON to HTML for the article page.
 *
 * KaTeX and the video facade are built after sanitising, and only from
 * validated data — the LaTeX string from the JSON, a video id that matched
 * its platform's pattern — never by widening the allow-list.
 */
export function renderArticle(content: unknown): string {
  const rendered = renderSanitized(content);
  if (!rendered) return "";
  return renderVideos(renderMath(rendered.html, rendered.formulas));
}

/** Plain-text preview for meta descriptions and search results. */
export function articleToPlainText(content: unknown, limit = 200): string {
  const rendered = renderSanitized(content);
  if (!rendered) return "";

  const text = videosToText(mathToText(rendered.html, rendered.formulas))
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}
