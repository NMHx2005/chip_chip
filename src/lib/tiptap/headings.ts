import { slugify } from "@/lib/post-slug";

export type ArticleHeading = {
  id: string;
  text: string;
  level: number;
};

type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
};

function collectText(node: Node): string {
  if (node.type === "text") return node.text ?? "";
  if (!Array.isArray(node.content)) return "";
  return node.content.map(collectText).join("");
}

/**
 * Headings an article's table of contents should list.
 *
 * Every h2/h3 in document order receives an id — including ones with no text,
 * which get a placeholder. The renderer walks the same list with the same
 * counter, so skipping an entry here would shift every id that follows it and
 * silently break the anchors.
 */
export function extractHeadings(content: unknown): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  const used = new Map<string, number>();

  const visit = (node: Node | undefined) => {
    if (!node || typeof node !== "object") return;

    if (node.type === "heading") {
      const level = node.attrs?.level;
      if (level === 2 || level === 3) {
        const text = collectText(node).trim();
        const base = text ? slugify(text) || `muc-${headings.length + 1}` : `muc-${headings.length + 1}`;
        const seen = used.get(base) ?? 0;
        used.set(base, seen + 1);

        headings.push({
          id: seen === 0 ? base : `${base}-${seen}`,
          text,
          level,
        });
      }
    }

    if (Array.isArray(node.content)) node.content.forEach(visit);
  };

  visit(content as Node);
  return headings;
}

/** Injects `id` attributes into the rendered headings, in document order. */
export function withHeadingIds(html: string, headings: ArticleHeading[]): string {
  let index = 0;

  return html.replace(/<h([23])([^>]*)>/g, (match, level: string, attrs: string) => {
    const heading = headings[index++];
    if (!heading) return match;
    return `<h${level}${attrs} id="${heading.id}">`;
  });
}
