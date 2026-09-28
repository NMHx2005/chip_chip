"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  MESSAGE_LIMITS,
  buildMessagePayload,
  sendMessage,
  type MessageErrorKey,
} from "@/lib/contact-client";
import type { MessageKind } from "@/lib/contact-message";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; error: MessageErrorKey };

const CONTACT_KINDS = ["contact", "feedback"] as const satisfies readonly MessageKind[];

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-base text-text outline-none transition-colors focus-visible:border-accent md:text-sm";

/**
 * The one form behind /api/messages.
 *
 * `contact` lets the reader pick Contact or Feedback; `report` is the
 * "report a mistake" form under an article and always sends `content_error`
 * with the article's id. Sending and reading the result live in
 * lib/contact-client.ts, so both variants behave identically.
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
  const id = useId();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const sending = status.state === "sending";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    const chosenKind = field("kind");

    setStatus({ state: "sending" });
    const outcome = await sendMessage(
      buildMessagePayload(
        {
          kind:
            variant === "report"
              ? "content_error"
              : chosenKind === "feedback"
                ? "feedback"
                : "contact",
          name: field("name"),
          email: field("email"),
          body: field("body"),
          website: field("website"),
          postId: variant === "report" ? postId : null,
        },
        locale
      ),
      fetch
    );

    if (outcome.ok) {
      form.reset();
      setStatus({ state: "sent" });
    } else {
      setStatus({ state: "error", error: outcome.error });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-5">
      {variant === "contact" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-text">{t("form.kindLegend")}</legend>
          <div className="flex flex-wrap gap-2">
            {CONTACT_KINDS.map((kind, index) => (
              <label
                key={kind}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm text-text-nav has-[:checked]:border-accent has-[:checked]:text-text"
              >
                <input
                  type="radio"
                  name="kind"
                  value={kind}
                  defaultChecked={index === 0}
                  className="size-4 accent-[#314344]"
                />
                {t(`form.kinds.${kind}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-semibold text-text">
            {t("form.nameLabel")}
          </label>
          <input
            id={`${id}-name`}
            name="name"
            required
            maxLength={MESSAGE_LIMITS.name}
            autoComplete="name"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-sm font-semibold text-text">
            {t("form.emailLabel")}
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            maxLength={MESSAGE_LIMITS.email}
            autoComplete="email"
            aria-describedby={`${id}-email-hint`}
            className={inputClassName}
          />
          <p id={`${id}-email-hint`} className="text-xs text-text-muted">
            {t("form.emailHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-body`} className="text-sm font-semibold text-text">
          {variant === "report" ? t("report.bodyLabel") : t("form.bodyLabel")}
        </label>
        <textarea
          id={`${id}-body`}
          name="body"
          required
          rows={variant === "report" ? 4 : 6}
          maxLength={MESSAGE_LIMITS.body}
          aria-describedby={`${id}-body-hint`}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text outline-none transition-colors focus-visible:border-accent md:text-sm"
        />
        <p id={`${id}-body-hint`} className="text-xs text-text-muted">
          {t("form.bodyHint", { max: MESSAGE_LIMITS.body })}
        </p>
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div aria-live="polite" aria-atomic="true" className="text-sm">
        {status.state === "error" && (
          <p className="text-red-700">{t(`errors.${status.error}`)}</p>
        )}
        {status.state === "sent" && (
          <p className="text-text">
            {variant === "report" ? t("report.sent") : t("form.sent")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={sending}
        aria-disabled={sending}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
      >
        {sending
          ? t("form.submitting")
          : variant === "report"
            ? t("report.submit")
            : t("form.submit")}
      </button>
    </form>
  );
}
