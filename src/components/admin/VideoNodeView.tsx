"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, videoRefFrom } from "@/lib/video";

/** Editor-only preview of an embedded video; the public page draws its own facade. */
export function VideoNodeView({ node, selected }: NodeViewProps) {
  const ref = videoRefFrom(node.attrs.platform, node.attrs.externalId);

  return (
    <NodeViewWrapper
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-3",
        selected && "outline outline-2 outline-offset-4 outline-black/30"
      )}
    >
      {ref?.platform === "youtube" && (
        // eslint-disable-next-line @next/next/no-img-element -- a fixed-size thumbnail from i.ytimg.com, not worth an image-optimizer round trip
        <img
          src={`https://i.ytimg.com/vi/${ref.externalId}/hqdefault.jpg`}
          alt=""
          className="h-16 w-28 shrink-0 rounded-lg object-cover"
        />
      )}
      <span className="text-sm text-text">
        {ref
          ? `Video ${PLATFORM_LABEL[ref.platform]} · ${ref.externalId}`
          : "Video không hợp lệ — xoá khối này và chèn lại."}
      </span>
    </NodeViewWrapper>
  );
}
