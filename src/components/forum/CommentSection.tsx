"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, MessageSquare, Reply } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Comment } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Root comments revealed per "show more" step. Must match the query default. */
export const ROOT_PAGE_SIZE = 20;

/**
 * Hard ceiling on root comments one page may load.
 *
 * The page clamps `?comments=N` to this, so beyond it the button would
 * re-render the same list — it is hidden instead.
 */
export const MAX_ROOT_COMMENTS = 200;

const ERROR_KEYS: Record<string, string> = {
  rate_limited: "errors.rateLimited",
  name_length: "errors.nameTooLong",
  body_length: "errors.bodyTooLong",
  email_invalid: "errors.emailInvalid",
  post_not_found: "errors.generic",
  insert_failed: "errors.generic",
  server_not_configured: "errors.generic",
};

function CommentBody({
  comment,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  onReply: (comment: Comment | null) => void;
  isReply?: boolean;
}) {
  const t = useTranslations("comments");
  const format = useFormatter();

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        isReply && "border-l-2 border-border pl-4"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-text">
          {comment.authorName}
        </span>

        {comment.isPostAuthor && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-700">
            {t("authorBadge")}
          </span>
        )}

        <time
          dateTime={comment.createdAt}
          className="text-xs text-text-muted"
        >
          {format.dateTime(new Date(comment.createdAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-nav">
        {comment.body}
      </p>

      {!isReply && (
        <button
          type="button"
          onClick={() => onReply(comment)}
          className="mt-0.5 inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-brand-600"
        >
          <Reply className="size-3.5" strokeWidth={2} />
          {t("reply")}
        </button>
      )}
    </div>
  );
}

function CommentForm({
  postId,
  replyTo,
  onCancelReply,
  onDone,
}: {
  postId: string;
  replyTo: Comment | null;
  onCancelReply: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("comments");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();

    if (!name) return setError(t("errors.nameRequired"));
    if (!body) return setError(t("errors.bodyRequired"));
    if (body.length > 2000) return setError(t("errors.bodyTooLong"));

    setSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId: replyTo?.id ?? null,
          name,
          email: String(data.get("email") ?? "").trim(),
          body,
          // Honeypot — kept off-screen, real readers never fill it.
          website: String(data.get("website") ?? ""),
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        const key = result.error ? ERROR_KEYS[result.error] : undefined;
        setError(key ? t(key) : t("errors.generic"));
        return;
      }

      form.reset();
      setNotice(t("success"));
      onCancelReply();
      onDone();
      router.refresh();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text">
        {replyTo ? t("replyingTo", { name: replyTo.authorName }) : t("formTitle")}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">
            {t("nameLabel")}
          </span>
          <input
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            className="h-10 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">
            {t("emailLabel")}{" "}
            <span className="font-normal">({t("emailHint")})</span>
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className="h-10 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-400"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="sr-only">{t("bodyLabel")}</span>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={2000}
          placeholder={t("bodyPlaceholder")}
          className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand-400"
        />
      </label>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>

        {replyTo && (
          <button
            type="button"
            onClick={onCancelReply}
            className="cursor-pointer text-sm text-text-muted underline"
          >
            {t("cancelReply")}
          </button>
        )}
      </div>
    </form>
  );
}

export function CommentSection({
  postId,
  slug,
  comments,
  count,
  totalRoots,
  shownRoots,
  maxRoots = MAX_ROOT_COMMENTS,
}: {
  postId: string;
  slug: string;
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
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const hasMore = shownRoots < totalRoots && shownRoots < maxRoots;

  return (
    <section
      id="comments"
      aria-label={t("title")}
      className="mt-16 border-t border-border pt-10"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em] text-text">
        <MessageSquare className="size-5 text-brand-500" strokeWidth={2} />
        {t("count", { count })}
      </h2>

      <div className="mt-6">
        <CommentForm
          postId={postId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onDone={() => undefined}
        />
      </div>

      <div className="mt-10">
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-7">
              {comments.map((comment) => (
                <li key={comment.id} className="flex flex-col gap-5">
                  <CommentBody comment={comment} onReply={setReplyTo} />

                  {comment.replies.length > 0 && (
                    <ul className="ml-2 flex flex-col gap-5 sm:ml-6">
                      {comment.replies.map((reply) => (
                        <li key={reply.id}>
                          <CommentBody
                            comment={reply}
                            onReply={setReplyTo}
                            isReply
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-xs text-text-muted">
                  {t("showingCount", {
                    shown: shownRoots,
                    total: totalRoots,
                  })}
                </p>
                <Link
                  href={{
                    pathname: "/dien-dan/[slug]",
                    params: { slug },
                    query: {
                      comments: Math.min(shownRoots + ROOT_PAGE_SIZE, maxRoots),
                    },
                  }}
                  scroll={false}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-nav transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  {t("loadMore")}
                  <ChevronDown className="size-4" strokeWidth={2.2} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
