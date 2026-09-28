"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { isAllowedFigureSrc } from "@/lib/tiptap/nodes/figure";

/** Editor-only view of a figure: the image plus its caption and alt text, editable in place. */
export function FigureNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const src: unknown = node.attrs.src;
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const caption = typeof node.attrs.caption === "string" ? node.attrs.caption : "";

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "flex flex-col gap-2 rounded-xl",
        selected && "outline outline-2 outline-offset-4 outline-black/30"
      )}
    >
      {isAllowedFigureSrc(src) ? (
        // eslint-disable-next-line @next/next/no-img-element -- the editor shows the uploaded file as-is; next/image adds nothing here
        <img src={src} alt={alt} className="rounded-xl" />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
          Ảnh không hợp lệ — xoá hình này và chèn lại.
        </p>
      )}
      <input
        value={caption}
        onChange={(event) => updateAttributes({ caption: event.target.value })}
        placeholder="Chú thích (tự đánh số Hình 1, Hình 2…)"
        aria-label="Chú thích hình"
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-black/30"
      />
      <input
        value={alt}
        onChange={(event) => updateAttributes({ alt: event.target.value })}
        placeholder="Mô tả ảnh cho người dùng trình đọc màn hình (alt)"
        aria-label="Văn bản thay thế của hình"
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-black/30"
      />
    </NodeViewWrapper>
  );
}
