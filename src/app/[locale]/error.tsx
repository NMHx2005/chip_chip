"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

/**
 * Error boundary for the public site.
 *
 * Catches rendering failures in `[locale]` routes — most likely a Supabase
 * blip. The reader gets a way forward instead of Next's default screen.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error("[locale error]", error);
  }, [error]);

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-text md:text-[34px]">
        {t("error")}
      </h1>
      <p className="mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-text-muted">
        {t("errorDescription")}
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/80"
      >
        <RotateCcw className="size-4" strokeWidth={2.2} />
        {t("retry")}
      </button>
    </section>
  );
}
