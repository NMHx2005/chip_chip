"use client";

import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form/Field";
import { FormNotice } from "@/components/ui/form/FormNotice";
import {
  firstInvalidField,
  validateComment,
  type CommentField,
  type CommentFieldError,
} from "@/lib/comment-form";
import type { Comment } from "@/lib/types";

/** Which field an API error belongs to, so it can be marked and focused. */
const ERROR_FIELDS: Record<string, CommentField> = {
  name_length: "name",
  body_length: "body",
  email_invalid: "email",
};

const ERROR_KEYS: Record<string, string> = {
  rate_limited: "errors.rateLimited",
  name_length: "errors.nameTooLong",
  body_length: "errors.bodyTooLong",
  email_invalid: "errors.emailInvalid",
};

type FieldErrors = Partial<Record<CommentField, string>>;

/**
 * The comment form: a white panel of `Field`s (visible labels, hint and error
 * wired by id), a `FormNotice` for the outcome and a busy-aware submit button.
 * A failed check marks every invalid field at once and focuses the first. Choosing
 * "Reply" on a comment brings the form into view and focuses the message.
 */
export function CommentForm({
  postId,
  replyTo,
  replyRequest,
  onCancelReply,
}: {
  postId: string;
  replyTo: Comment | null;
  /** Changes on every Reply click, including a second click on the same comment. */
  replyRequest: number;
  onCancelReply: () => void;
}) {
  const t = useTranslations("comments");
  const router = useRouter();
  const honeypotId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fieldRef = { name: nameRef, email: emailRef, body: bodyRef } as const;

  // Reply: bring the form into view (at once under reduced motion), then focus
  // the message without a second scroll.
  useEffect(() => {
    if (!replyRequest) return;
    // A notice belongs to the comment just sent; starting a reply moves on.
    setSuccess(false);
    setFailure(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    bodyRef.current?.focus({ preventScroll: true });
  }, [replyRequest]);


  const clearError = (field: CommentField) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const message = (code: CommentFieldError) => t(`errors.${code}`);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setFailure(null);
    setSuccess(false);

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();

    const problems = validateComment({ name, email, body });
    const first = firstInvalidField(problems);
    if (first) {
      // Committed before focusing, so a screen reader meets the field already
      // marked invalid and described by its error.
      flushSync(() =>
        setFieldErrors({
          name: problems.name && message(problems.name),
          email: problems.email && message(problems.email),
          body: problems.body && message(problems.body),
        })
      );
      fieldRef[first].current?.focus();
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId: replyTo?.id ?? null,
          name,
          email,
          body,
          // Honeypot — kept off-screen, real readers never fill it.
          website: String(data.get("website") ?? ""),
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        const key = result.error ? ERROR_KEYS[result.error] : undefined;
        const text = key ? t(key) : t("errors.generic");
        const field = result.error ? ERROR_FIELDS[result.error] : undefined;
        if (field) {
          flushSync(() => setFieldErrors({ [field]: text }));
          fieldRef[field].current?.focus();
        } else {
          setFailure(text);
        }
        return;
      }

      form.reset();
      setSuccess(true);
      onCancelReply();
      router.refresh();
    } catch {
      setFailure(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={formRef}
      className="rounded-3xl border border-border bg-surface p-5 md:p-7"
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <h3 className="text-lg font-bold leading-[1.3] text-text [overflow-wrap:anywhere]">
          {replyTo ? t("replyingTo", { name: replyTo.authorName }) : t("formTitle")}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("nameLabel")} error={fieldErrors.name}>
            {(control) => (
              <Input
                {...control}
                ref={nameRef}
                name="name"
                required
                aria-required
                maxLength={80}
                autoComplete="name"
                placeholder={t("namePlaceholder")}
                onChange={() => clearError("name")}
              />
            )}
          </Field>

          <Field
            label={t("emailLabel")}
            optionalNote={t("emailOptional")}
            hint={t("emailHint")}
            error={fieldErrors.email}
          >
            {(control) => (
              <Input
                {...control}
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={t("emailPlaceholder")}
                onChange={() => clearError("email")}
              />
            )}
          </Field>
        </div>

        <Field label={t("bodyLabel")} error={fieldErrors.body}>
          {(control) => (
            <Textarea
              {...control}
              ref={bodyRef}
              name="body"
              required
              aria-required
              rows={5}
              maxLength={2000}
              className="min-h-[132px]"
              placeholder={t("bodyPlaceholder")}
              onChange={() => clearError("body")}
            />
          )}
        </Field>

        {/* Honeypot — hidden from people and assistive tech, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
          <label htmlFor={honeypotId}>{t("honeypotLabel")}</label>
          <input id={honeypotId} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {failure && <FormNotice tone="error">{failure}</FormNotice>}
        {success && <FormNotice tone="success">{t("success")}</FormNotice>}

        <div className="flex items-center gap-4">
          <Button type="submit" busy={submitting} className="flex-1 sm:flex-none">
            {submitting ? t("submitting") : t("submit")}
          </Button>

          {replyTo && (
            <button
              type="button"
              onClick={() => {
                onCancelReply();
                // The button unmounts; keep the keyboard user in the form.
                bodyRef.current?.focus({ preventScroll: true });
              }}
              className="min-h-11 min-w-11 cursor-pointer text-sm font-semibold text-text-nav underline underline-offset-[3px] [@media(hover:hover)]:hover:text-accent"
            >
              {t("cancelReply")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
