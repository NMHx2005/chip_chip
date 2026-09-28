import { Node } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * An image the article can refer to as "Hình N." / "Figure N.".
 *
 * `caption` and `alt` are plain strings rather than rich content: the
 * numbering is CSS (see `.chip-prose figcaption` in globals.css), and plain
 * attributes keep the translator's job to one segment each.
 */

/**
 * Figures only load from https or from this project's own Supabase bucket —
 * the local stack serves that over plain http, so an https-only rule would
 * break every figure in development.
 */
export function isAllowedFigureSrc(
  src: unknown,
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
): src is string {
  if (typeof src !== "string") return false;
  if (src.startsWith("https://")) return true;
  if (!supabaseUrl) return false;
  try {
    const origin = new URL(supabaseUrl).origin;
    return src.startsWith(`${origin}/storage/v1/object/public/`);
  } catch {
    return false;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null, rendered: false },
      alt: { default: "", rendered: false },
      caption: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const img = element.querySelector("img");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: element.querySelector("figcaption")?.textContent ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const children: DOMOutputSpec[] = [];
    if (isAllowedFigureSrc(node.attrs.src)) {
      children.push([
        "img",
        { src: node.attrs.src, alt: text(node.attrs.alt), loading: "lazy", decoding: "async" },
      ]);
    }
    const caption = text(node.attrs.caption);
    if (caption) children.push(["figcaption", {}, caption]);
    return ["figure", {}, ...children];
  },
});
