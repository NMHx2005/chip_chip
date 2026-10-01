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
import { SIGNUP_TYPES, signupKindToMessageKind, type SignupType } from "@/components/signup/signup-kind";
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
import { cn } from "@/lib/utils";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; error: MessageErrorKey };

const FIELD_ORDER: MessageFormField[] = ["name", "email", "body"];

// Server-only errors get a heading; `postNotFound` has none.
const SERVER_TITLE: Partial<Record<MessageErrorKey, string>> = {
  rateLimited: "rateLimitedTitle",
  network: "networkTitle",
  generic: "genericTitle",
};

/**
 * The one sign-up form, used by /dang-ky and embedded on the About page.
 *
 * It reuses the contact form's machinery — the same validation, the same
 * `/api/messages` route, the same honeypot and rate limit — and only adds the
 * type selector; the chosen type becomes the message `kind`.
 */
export function SignupForm() {
  const t = useTranslations("signup");
  const tContact = useTranslations("contact");
  const locale = useLocale() as Locale;

  const uid = useId();
  const ids = { name: `${uid}-name`, email: `${uid}-email`, body: `${uid}-body` } as const;

  const [type, setType] = useState<SignupType>("volunteer");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<MessageFieldErrors>({});

  const sending = status.state === "sending";
  const errorCount = FIELD_ORDER.filter((field) => errors[field]).length;
  const hasNotice = errorCount > 0 || status.state !== "idle";

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const refs = { name: nameRef, email: emailRef, body: bodyRef } as const;

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
          kind: signupKindToMessageKind(type),
          ...values,
          website: value("website"),
          postId: null,
        },
        locale
      ),
      fetch
    );

    if (outcome.ok) {
      form.reset();
      setType("volunteer");
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
        <RadioSegment
          legend={t("typeLegend")}
          name="kind"
          options={SIGNUP_TYPES.map((value) => ({ value, label: t(`types.${value}`) }))}
          value={type}
          onChange={setType}
          hint={t(`typeHint.${type}`)}
          disabled={sending}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={tContact("form.nameLabel")}
            id={ids.name}
            error={errors.name ? tContact(`errors.${errors.name}`) : undefined}
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
            label={tContact("form.emailLabel")}
            optionalNote={tContact("form.optionalNote")}
            id={ids.email}
            hint={tContact("form.emailHint")}
            error={errors.email ? tContact(`errors.${errors.email}`) : undefined}
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
          label={t("bodyLabel")}
          id={ids.body}
          hint={t("bodyHint", { max: MESSAGE_LIMITS.body })}
          error={errors.body ? tContact(`errors.${errors.body}`) : undefined}
        >
          {(control) => (
            <Textarea
              {...control}
              ref={bodyRef}
              name="body"
              required
              rows={5}
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
            Website
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
          <FormNotice tone="error" title={tContact("form.errorSummary", { count: errorCount })}>
            <ul className="flex flex-col">
              {FIELD_ORDER.filter((field) => errors[field]).map((field) => (
                <li key={field} className="-my-1.5">
                  <a
                    href={`#${ids[field]}`}
                    onClick={() => refs[field].current?.focus()}
                    className="inline-flex min-h-11 items-center text-left font-semibold underline underline-offset-4"
                  >
                    {tContact(`errors.${errors[field]}`)}
                  </a>
                </li>
              ))}
            </ul>
          </FormNotice>
        )}

        {status.state === "sending" && <FormNotice tone="note">{t("sending")}</FormNotice>}

        {status.state === "sent" && (
          <FormNotice tone="success" title={t("sent")}>
            {t("sentBody")}
          </FormNotice>
        )}

        {status.state === "error" && (
          <FormNotice
            tone="error"
            title={SERVER_TITLE[status.error] ? tContact(`errors.${SERVER_TITLE[status.error]}`) : undefined}
          >
            <p>{tContact(`errors.${status.error}`)}</p>
            <p className="mt-1">{tContact("form.kept")}</p>
          </FormNotice>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" busy={sending} className="w-full sm:w-auto">
          {sending ? tContact("form.submitting") : t("submit")}
        </Button>
        <p className="text-[13px] leading-relaxed text-text-muted">{t("note")}</p>
      </div>
    </form>
  );
}
