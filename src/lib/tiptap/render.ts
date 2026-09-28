import "server-only";

import { generateHTML } from "@tiptap/html";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { extractHeadings, withHeadingIds } from "@/lib/tiptap/headings";
import { sanitizeArticleHtml } from "@/lib/tiptap/sanitize";

/**
 * Renders stored Tiptap JSON to HTML for the article page.
 *
 * Content is stored as JSON rather than HTML so nothing executable is ever
 * persisted. `generateHTML` runs in Node without a DOM (it uses zeed-dom
 * internally), and `sanitizeArticleHtml` then runs as a second line of
 * defence — only staff can write articles, but sanitising on the way out is
 * cheap insurance against a hand-edited database row or a future importer.
 *
 * Heading ids are injected so the table of contents can link to them.
 */
export function renderArticle(content: unknown): string {
  if (!content || typeof content !== "object") return "";

  let raw: string;
  try {
    raw = generateHTML(
      content as Parameters<typeof generateHTML>[0],
      articleExtensions
    );
  } catch {
    // Malformed JSON in the column — render nothing rather than a 500.
    return "";
  }

  // Ids go in after sanitising: the sanitiser escapes `<` inside attribute
  // values, so an alt text containing "<h2>" can no longer be mistaken for a
  // heading and shift every anchor after it.
  return withHeadingIds(sanitizeArticleHtml(raw), extractHeadings(content));
}

/** Plain-text preview for meta descriptions and search results. */
export function articleToPlainText(content: unknown, limit = 200): string {
  const html = renderArticle(content);
  const text = html
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
