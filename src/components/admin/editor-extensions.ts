import type { AnyExtension } from "@tiptap/core";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureNodeView } from "@/components/admin/FigureNodeView";
import { VideoNodeView } from "@/components/admin/VideoNodeView";
import type { MathKind } from "@/components/admin/math-prompt";
import { KATEX_OPTIONS } from "@/lib/tiptap/math";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { Figure } from "@/lib/tiptap/nodes/figure";
import { VideoEmbed } from "@/lib/tiptap/nodes/video";

/**
 * The article schema plus what only the editor needs: React views for
 * figures and videos, and click-to-edit formulas.
 *
 * Only node views and options change here — never a node's name, attributes
 * or content — so the editor and the server renderer still share one schema.
 * `Mathematics` is split into its two nodes because it hands one set of KaTeX
 * options to both, and block formulas need `displayMode`.
 */
export function buildEditorExtensions(
  onMathClick: (kind: MathKind, latex: string, pos: number) => void
): AnyExtension[] {
  return articleExtensions.flatMap((extension): AnyExtension[] => {
    if (extension.name === "Mathematics") {
      return [
        InlineMath.configure({
          katexOptions: KATEX_OPTIONS,
          onClick: (node, pos) => onMathClick("inline", String(node.attrs.latex ?? ""), pos),
        }),
        BlockMath.configure({
          katexOptions: { ...KATEX_OPTIONS, displayMode: true },
          onClick: (node, pos) => onMathClick("block", String(node.attrs.latex ?? ""), pos),
        }),
      ];
    }
    if (extension.name === Figure.name) {
      return [Figure.extend({ addNodeView: () => ReactNodeViewRenderer(FigureNodeView) })];
    }
    if (extension.name === VideoEmbed.name) {
      return [VideoEmbed.extend({ addNodeView: () => ReactNodeViewRenderer(VideoNodeView) })];
    }
    return [extension];
  });
}
