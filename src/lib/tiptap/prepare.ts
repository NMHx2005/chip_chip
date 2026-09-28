import { videoRefFrom } from "@/lib/video";

/**
 * Readies stored Tiptap JSON for `generateHTML`.
 *
 * Measured on @tiptap/extension-mathematics 3.31.3: `generateHTML` escapes
 * `&` and `"` inside `data-latex` but leaves `<` and `>` raw, so a formula
 * such as `a > b` would travel through the sanitiser as half an attribute.
 * The LaTeX therefore never enters the HTML at all: each formula's text is
 * collected here, and the node keeps only its index. `renderMath` looks the
 * index up after sanitising, so the only LaTeX KaTeX ever sees comes straight
 * from the JSON.
 *
 * Video nodes whose (platform, id) would not pass the database constraint are
 * dropped here, before any HTML exists.
 */

export type Formula = { latex: string; display: boolean };

type JsonNode = {
  type?: unknown;
  attrs?: Record<string, unknown>;
  content?: unknown;
};

export type PreparedArticle = { doc: JsonNode; formulas: Formula[] };

export function prepareArticle(content: unknown): PreparedArticle | null {
  if (!content || typeof content !== "object") return null;

  const formulas: Formula[] = [];

  const visit = (node: JsonNode): JsonNode | null => {
    if (node.type === "inlineMath" || node.type === "blockMath") {
      const latex = typeof node.attrs?.latex === "string" ? node.attrs.latex : "";
      formulas.push({ latex, display: node.type === "blockMath" });
      return { ...node, attrs: { latex: String(formulas.length - 1) } };
    }

    if (node.type === "video") {
      const ref = videoRefFrom(node.attrs?.platform, node.attrs?.externalId);
      return ref ? { ...node, attrs: { platform: ref.platform, externalId: ref.externalId } } : null;
    }

    // A malformed `content` is left for generateHTML to reject, so the
    // renderer keeps failing closed exactly as before.
    if (!Array.isArray(node.content)) return node;

    return {
      ...node,
      content: node.content.flatMap((child: unknown) => {
        if (!child || typeof child !== "object") return [child];
        const next = visit(child as JsonNode);
        return next ? [next] : [];
      }),
    };
  };

  const doc = visit(content as JsonNode);
  return doc ? { doc, formulas } : null;
}
