"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Reply } from "lucide-react";
import { commentInitial, freshDelaySeconds } from "@/lib/comment-form";
import type { Comment } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One comment: avatar with the name's first letter, name, author badge, time,
 * body and, on a root comment, a Reply button. `fresh` makes a comment that
 * just arrived rise in (`freshIndex` staggers a batch); it is off under reduced
 * motion.
 */
export function CommentItem({
  comment,
  onReply,
  isReply = false,
  fresh = false,
  freshIndex = 0,
}: {
  comment: Comment;
  onReply: (comment: Comment) => void;
  isReply?: boolean;
  fresh?: boolean;
  freshIndex?: number;
}) {
  const t = useTranslations("comments");
  const format = useFormatter();

  return (
    <div
      className={cn(
        "flex gap-3",
        isReply && "ml-2 border-l-2 border-border pl-3 sm:ml-6 sm:pl-4",
        fresh && "motion-safe:animate-comment-in"
      )}
      // Inline: the animation shorthand of `motion-safe:animate-*` would reset a delay class.
      style={fresh ? { animationDelay: `${freshDelaySeconds(freshIndex)}s` } : undefined}
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-[13px] font-extrabold text-text"
      >
        {commentInitial(comment.authorName)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-text [overflow-wrap:anywhere]">
            {comment.authorName}
          </span>

          {comment.isPostAuthor && (
            <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
              {t("authorBadge")}
            </span>
          )}

          <time dateTime={comment.createdAt} className="text-xs text-text-nav">
            {format.dateTime(new Date(comment.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-[1.6] text-text-nav [overflow-wrap:anywhere]">
          {comment.body}
        </p>

        {!isReply && (
          <button
            type="button"
            onClick={() => onReply(comment)}
            aria-label={t("replyTo", { name: comment.authorName })}
            className="-ml-2 inline-flex min-h-11 w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-text-nav transition-colors duration-fast ease-standard motion-reduce:transition-none [@media(hover:hover)]:hover:text-accent"
          >
            <Reply aria-hidden className="size-4" strokeWidth={2} />
            {t("reply")}
          </button>
        )}
      </div>
    </div>
  );
}
