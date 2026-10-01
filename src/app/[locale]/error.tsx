"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Error boundary for the public site.
 *
 * Catches rendering failures in `[locale]` routes — most likely a Supabase
 * blip. The reader gets a way forward instead of Next's default screen, a retry
 * that shows it is working, and the error code to quote when reporting it.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const [retrying, setRetrying] = useState(false);
  const [failedAgain, setFailedAgain] = useState(false);
  const retryingRef = useRef(false);

  useEffect(() => {
    console.error("[locale error]", error);
  }, [error]);

  // A retry that works unmounts this boundary; still being here means the
  // retry failed and handed us a new error (design ER7). The flag lives in a
  // ref so this effect only runs when the error changes.
  useEffect(() => {
    if (!retryingRef.current) return;
    retryingRef.current = false;
    setRetrying(false);
    setFailedAgain(true);
  }, [error]);

  const retry = () => {
    if (retryingRef.current) return;
    retryingRef.current = true;
    setFailedAgain(false);
    setRetrying(true);
    // Let the busy state paint before the (synchronous) retry runs.
    requestAnimationFrame(() => reset());
  };

  return (
    <section className="px-5 py-14 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-content">
        <EmptyState
          eyebrow={t("eyebrowRuntime")}
          headingLevel="h1"
          chip="error"
          tone="error"
          title={t("titleRuntime")}
          description={t("descRuntime")}
          className="min-h-0 gap-5 sm:min-h-[520px]"
          actions={
            <>
              <div className="flex flex-col items-center gap-3">
                {/* aria-disabled, not disabled: a disabled control drops focus. */}
                <button
                  type="button"
                  onClick={retry}
                  aria-disabled={retrying || undefined}
                  aria-busy={retrying || undefined}
                  className={cn(
                    buttonClassName("primary"),
                    retrying &&
                      "cursor-progress bg-disabled text-white [@media(hover:hover)]:hover:bg-disabled active:scale-100"
                  )}
                >
                  <RotateCcw aria-hidden className="size-4 shrink-0" strokeWidth={2.2} />
                  {retrying ? t("retrying") : t("retry")}
                </button>
                {retrying && (
                  <p role="status" className="text-sm leading-relaxed text-text-muted">
                    {t("retryStatus")}
                  </p>
                )}
                {failedAgain && !retrying && (
                  <p role="alert" className="text-sm font-medium leading-relaxed text-err">
                    {t("retryFailed")}
                  </p>
                )}
              </div>
              <Button href="/" variant="secondary">
                {t("home")}
              </Button>
            </>
          }
          after={
            <div className="mt-2 flex flex-col items-center gap-4">
              {error.digest && (
                <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-xl border border-border py-1.5 pl-3.5 pr-1.5 text-sm text-text-muted">
                  <span className="text-xs font-bold uppercase tracking-[0.08em]">
                    {t("digestLabel")}
                  </span>
                  <code className="select-all rounded-lg bg-surface-muted px-3 py-2 font-mono text-sm text-text [overflow-wrap:anywhere]">
                    {error.digest}
                  </code>
                </p>
              )}
              <p className="text-sm leading-relaxed text-text-muted">
                {t("reportHint")}{" "}
                <Link
                  href="/lien-he"
                  className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-black"
                >
                  {t("reportLink")}
                </Link>
              </p>
            </div>
          }
        />
      </div>
    </section>
  );
}
