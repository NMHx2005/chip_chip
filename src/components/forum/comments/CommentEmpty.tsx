import { MessageSquare } from "lucide-react";

/** The small "no comments yet" box: one line, not the page-sized EmptyState. */
export function CommentEmpty({ children }: { children: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-[#A8A8A8] bg-white/50 px-6 py-5 motion-safe:animate-notice-in"
    >
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-text-nav"
      >
        <MessageSquare className="size-5" strokeWidth={2} />
      </span>
      <p className="text-sm leading-[1.5] text-text-nav">{children}</p>
    </div>
  );
}
