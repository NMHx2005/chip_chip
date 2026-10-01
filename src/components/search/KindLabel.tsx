import { BookOpen, FileText, PlayCircle, type LucideIcon } from "lucide-react";
import type { PostKind } from "@/lib/types";

/** The one kind→icon map, shared by the row label and the group headings. */
export const KIND_ICON: Record<PostKind, LucideIcon> = {
  lesson: BookOpen,
  video: PlayCircle,
  forum: FileText,
};

/** A result's kind: an icon plus its uppercased name, so the row reads without colour. */
export function KindLabel({ kind, label }: { kind: PostKind; label: string }) {
  const Icon = KIND_ICON[kind];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.06em] text-[#262626]">
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={2} />
      {label}
    </span>
  );
}
