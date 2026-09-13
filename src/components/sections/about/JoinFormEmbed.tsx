"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

/**
 * Google Form embed.
 *
 * The iframe is only created after the reader clicks. An eager embed would pull
 * Google's scripts and set third-party cookies on every visit to /gioi-thieu,
 * which is a lot of tracking to load on a page most readers never use.
 */
export function JoinFormEmbed({ url }: { url: string }) {
  const t = useTranslations("about.join");
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-text-muted">
        {t("formNote")}
      </p>
    );
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <p className="max-w-md text-sm text-text-muted">{t("formNote")}</p>
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          {t("formCta")}
          <ArrowUpRight className="size-4" strokeWidth={2.2} />
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <iframe
        src={url}
        title={t("headline")}
        loading="lazy"
        className="h-[1200px] w-full border-0"
      />
    </div>
  );
}
