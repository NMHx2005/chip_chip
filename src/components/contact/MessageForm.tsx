"use client";

import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  fieldForError,
  validateMessageFields,
  type MessageFieldErrors,
  type MessageFormField,
} from "@/components/contact/message-form-fields";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form/Field";
import { FormNotice } from "@/components/ui/form/FormNotice";
import { RadioSegment } from "@/components/ui/form/RadioSegment";
import {
  MESSAGE_LIMITS,
  buildMessagePayload,
  sendMessage,
  type MessageErrorKey,
} from "@/lib/contact-client";
import type { MessageKind } from "@/lib/contact-message";
import { cn } from "@/lib/utils";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; error: MessageErrorKey };

const CONTACT_KINDS = ["contact", "feedback"] as const satisfies readonly MessageKind[];
const FIELD_ORDER: MessageFormField[] = ["name", "email", "body"];

// Server-only errors get a heading; `postNotFound` has none.
const SERVER_TITLE: Partial<Record<MessageErrorKey, string>> = {
  rateLimited: "rateLimitedTitle",
  network: "networkTitle",
  generic: "genericTitle",
};

/**
 * The one form behind /api/messages.
 *
 * `contact` lets the reader pick Contact or Feedback; `report` is the
 * "report a mistake" form under an article and always sends `content_error`
 * with the article's id. Sending and reading the result live in
 * lib/contact-client.ts, so both variants behave identically.
 *
 * On submit the whole form is checked at once (validateMessageFields), so the
 * reader sees every problem, not just the first; the server repeats each check.
 * The notices live in a region that is always in the DOM (empty = display:none)
 * so a screen reader reads the change, and the busy subtree is only the fields,
 * so "sending…" is not swallowed by `aria-busy`.
 */
export function MessageForm({
  variant,
  postId = null,
}: {
  variant: "contact" | "report";
  postId?: string | null;
}) {
  const t = useTranslations("contact");
  const locale = useLocale() as Locale;
  const report = variant === "report";

  const uid = useId();
  const ids = { name: `${uid}-name`, email: `${uid}-email`, body: `${uid}-body` } as const;

  const [kind, setKind] = useState<MessageKind>("contact");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<MessageFieldErrors>({});

  const sending = status.state === "sending";
  const errorCount = FIELD_ORDER.filter((field) => errors[field]).length;
  const hasNotice = errorCount > 0 || status.state !== "idle";
  const bodyLabel = report ? t("report.bodyLabel") : t("form.bodyLabel");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const refs = { name: nameRef, email: emailRef, body: bodyRef } as const;

  /** Clears one field's error once the reader edits it. */
  const clearError = (field: MessageFormField) => () =>
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => {
      const raw = data.get(name);
      return typeof raw === "string" ? raw : "";
    };

    const values = { name: value("name"), email: value("email"), body: value("body") };
    const found = validateMessageFields(values);
    if (Object.keys(found).length > 0) {
      const first = FIELD_ORDER.find((field) => found[field]);
      // Committed before focusing, so a screen reader meets the field already
      // marked invalid and described by its error.
      flushSync(() => {
        setErrors(found);
        setStatus({ state: "idle" });
      });
      if (first) refs[first].current?.focus();
      return;
    }

    setErrors({});
    setStatus({ state: "sending" });
    const outcome = await sendMessage(
      buildMessagePayload(
        {
          kind: report ? "content_error" : kind,
          ...values,
          website: value("website"),
          postId: report ? postId : null,
        },
        locale
      ),
      fetch
    );

    if (outcome.ok) {
      form.reset();
      setKind("contact");
      setStatus({ state: "sent" });
    } else {
      const field = fieldForError(outcome.error);
      flushSync(() => setStatus({ state: "error", error: outcome.error }));
      if (field) refs[field].current?.focus();
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-5">
      {/* Only the fields are busy, so the notice region below is still announced. */}
      <div aria-busy={sending || undefined} className="flex flex-col gap-5">
        {!report && (
          <RadioSegment
            legend={t("form.kindLegend")}
            name="kind"
            options={CONTACT_KINDS.map((value) => ({ value, label: t(`form.kinds.${value}`) }))}
            value={kind}
            onChange={setKind}
            hint={t(`form.kindHint.${kind}`)}
            disabled={sending}
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("form.nameLabel")}
            id={ids.name}
            error={errors.name ? t(`errors.${errors.name}`) : undefined}
          >
            {(control) => (
              <Input
                {...control}
                ref={nameRef}
                name="name"
                required
                maxLength={MESSAGE_LIMITS.name}
                autoComplete="name"
                readOnly={sending}
                onChange={clearError("name")}
              />
            )}
          </Field>

          <Field
            label={t("form.emailLabel")}
            optionalNote={t("form.optionalNote")}
            id={ids.email}
            hint={t("form.emailHint")}
            error={errors.email ? t(`errors.${errors.email}`) : undefined}
          >
            {(control) => (
              <Input
                {...control}
                ref={emailRef}
                name="email"
                type="email"
                maxLength={MESSAGE_LIMITS.email}
                autoComplete="email"
                spellCheck={false}
                readOnly={sending}
                onChange={clearError("email")}
              />
            )}
          </Field>
        </div>

        <Field
          label={bodyLabel}
          id={ids.body}
          hint={t("form.bodyHint", { max: MESSAGE_LIMITS.body })}
          error={errors.body ? t(`errors.${errors.body}`) : undefined}
        >
          {(control) => (
            <Textarea
              {...control}
              ref={bodyRef}
              name="body"
              required
              rows={report ? 4 : 6}
              maxLength={MESSAGE_LIMITS.body}
              readOnly={sending}
              onChange={clearError("body")}
            />
          )}
        </Field>

        {/* Honeypot — hidden from people, irresistible to bots. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
        >
          <label>
            {t("form.honeypotLabel")}
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className={cn("flex-col gap-3", hasNotice ? "flex" : "hidden")}
      >
        {errorCount > 0 && (
          <FormNotice tone="error" title={t("form.errorSummary", { count: errorCount })}>
            <ul className="flex flex-col">
              {FIELD_ORDER.filter((field) => errors[field]).map((field) => (
                <li key={field} className="-my-1.5">
                  <a
                    href={`#${ids[field]}`}
                    onClick={() => refs[field].current?.focus()}
                    className="inline-flex min-h-11 items-center text-left font-semibold underline underline-offset-4"
                  >
                    {t(`errors.${errors[field]}`)}
                  </a>
                </li>
              ))}
            </ul>
          </FormNotice>
        )}

        {status.state === "sending" && <FormNotice tone="note">{t("form.sending")}</FormNotice>}

        {status.state === "sent" && (
          <FormNotice tone="success" title={report ? t("report.sent") : t("form.sent")}>
            {report ? t("report.sentBody") : t("form.sentBody")}
          </FormNotice>
        )}

        {status.state === "error" && (
          <FormNotice
            tone="error"
            title={SERVER_TITLE[status.error] ? t(`errors.${SERVER_TITLE[status.error]}`) : undefined}
          >
            <p>{t(`errors.${status.error}`)}</p>
            <p className="mt-1">{report ? t("report.kept") : t("form.kept")}</p>
          </FormNotice>
        )}
      </div>

      <div className="flex">
        <Button type="submit" busy={sending} className="w-full sm:w-auto">
          {sending ? t("form.submitting") : report ? t("report.submit") : t("form.submit")}
        </Button>
      </div>
    </form>
  );
}
