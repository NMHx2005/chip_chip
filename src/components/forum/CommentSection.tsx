"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, MessageSquare } from "lucide-react";
import { CommentEmpty } from "@/components/forum/comments/CommentEmpty";
import { CommentForm } from "@/components/forum/comments/CommentForm";
import { CommentItem } from "@/components/forum/comments/CommentItem";
import { Button } from "@/components/ui/Button";
import { freshCommentIds } from "@/lib/comment-form";
import type { Comment } from "@/lib/types";

/** Root comments revealed per "show more" step. Must match the query default. */
export const ROOT_PAGE_SIZE = 20;

/**
 * Hard ceiling on root comments one page may load.
 *
 * The page clamps `?comments=N` to this, so beyond it the button would
 * re-render the same list — it is hidden instead.
 */
export const MAX_ROOT_COMMENTS = 200;

export function CommentSection({
  postId,
  slug,
  section = "/blog/[slug]",
  comments,
  count,
  totalRoots,
  shownRoots,
  maxRoots = MAX_ROOT_COMMENTS,
}: {
  postId: string;
  slug: string;
  /** The page the thread sits on, so "show more" reloads that same page. */
  section?: "/blog/[slug]" | "/video/[slug]";
  comments: Comment[];
  count: number;
  /** Root comments in the whole thread, including ones not loaded yet. */
  totalRoots: number;
  /** Root comments currently rendered. */
  shownRoots: number;
  /** Ceiling the page clamps `?comments=N` to. */
  maxRoots?: number;
}) {
  const t = useTranslations("comments");
  // `n` changes on every click, so choosing the same comment twice still brings the form back.
  const [reply, setReply] = useState<{ comment: Comment; n: number } | null>(null);
  const replyCounter = useRef(0);
  const startReply = (comment: Comment) => setReply({ comment, n: ++replyCounter.current });
  const hasMore = shownRoots < totalRoots && shownRoots < maxRoots;

  // Comments that were not on screen at the previous render rise in. `null`
  // marks "not rendered yet", so the first paint of a page does not animate.
  const seen = useRef<Set<string> | null>(null);
  const ids = comments.flatMap((comment) => [comment.id, ...comment.replies.map((r) => r.id)]);
  // Once marked, a comment keeps its class, so an unrelated re-render (opening
  // a reply, say) does not cut its animation short.
  const freshOrder = useRef(new Map<string, number>()).current;
  freshCommentIds(seen.current, ids).forEach((id, index) => {
    if (!freshOrder.has(id)) freshOrder.set(id, index);
  });
  useEffect(() => {
    seen.current = new Set(ids);
  });

  return (
    <section
      id="comments"
      aria-labelledby="comments-h"
      className="mt-12 border-t border-border pt-8 lg:mt-16 lg:pt-10"
    >
      <h2
        id="comments-h"
        className="flex items-center gap-2.5 text-[22px] font-extrabold leading-[1.2] tracking-[-0.02em] text-text lg:text-[26px]"
      >
        <MessageSquare aria-hidden className="size-5 text-accent lg:size-[22px]" strokeWidth={2} />
        {t("count", { count })}
      </h2>

      <div className="mt-6">
        <CommentForm
          postId={postId}
          replyTo={reply?.comment ?? null}
          replyRequest={reply?.n ?? 0}
          onCancelReply={() => setReply(null)}
        />
      </div>

      <div className={comments.length === 0 ? "mt-7" : "mt-10"}>
        {comments.length === 0 ? (
          <CommentEmpty>{t("empty")}</CommentEmpty>
        ) : (
          <>
            <ul className="flex flex-col gap-7">
              {comments.map((comment) => (
                <li key={comment.id} className="flex flex-col gap-5">
                  <CommentItem
                    comment={comment}
                    onReply={startReply}
                    fresh={freshOrder.has(comment.id)}
                    freshIndex={freshOrder.get(comment.id)}
                  />

                  {comment.replies.length > 0 && (
                    <ul className="flex flex-col gap-5">
                      {comment.replies.map((reply) => (
                        <li key={reply.id}>
                          <CommentItem
                            comment={reply}
                            onReply={startReply}
                            isReply
                            fresh={freshOrder.has(reply.id)}
                            freshIndex={freshOrder.get(reply.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <p role="status" aria-live="polite" className="text-sm tabular-nums text-text-nav">
                  {t("showingCount", { shown: shownRoots, total: totalRoots })}
                </p>
                <Button
                  variant="secondary"
                  scroll={false}
                  href={{
                    pathname: section,
                    params: { slug },
                    query: { comments: Math.min(shownRoots + ROOT_PAGE_SIZE, maxRoots) },
                  }}
                >
                  {t("loadMore")}
                  <ChevronDown aria-hidden className="size-4" strokeWidth={2.2} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
