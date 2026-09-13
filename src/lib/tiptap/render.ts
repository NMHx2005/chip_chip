import "server-only";

import { generateHTML } from "@tiptap/html";
import DOMPurify from "isomorphic-dompurify";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { extractHeadings, withHeadingIds } from "@/lib/tiptap/headings";

/**
 * Renders stored Tiptap JSON to HTML for the article page.
 *
 * Content is stored as JSON rather than HTML so nothing executable is ever
 * persisted. `generateHTML` runs in Node without a DOM (it uses zeed-dom
 * internally), and DOMPurify then runs as a second line of defence — only
 * staff can write articles, but sanitising on the way out is cheap insurance
 * against a hand-edited database row or a future importer.
 *
 * Heading ids are injected so the table of contents can link to them.
 */
export function renderArticle(content: unknown): string {
  if (!content || typeof content !== "object") return "";

  let html: string;
  try {
    const raw = generateHTML(
      content as Parameters<typeof generateHTML>[0],
      articleExtensions
    );
    html = withHeadingIds(raw, extractHeadings(content));
  } catch {
    // Malformed JSON in the column — render nothing rather than a 500.
    return "";
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "strong", "em", "u", "s", "code", "pre", "mark",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li",
      "blockquote",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "title", "loading", "decoding",
      "class", "style", "id",
      "colspan", "rowspan",
    ],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  });
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
