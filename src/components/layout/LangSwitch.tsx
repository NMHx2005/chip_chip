"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  LOCALE_LABELS,
  LOCALE_NAMES,
  routing,
  type Locale,
} from "@/i18n/routing";
import { safePathFor } from "@/components/layout/langSwitchPath";
import { cn } from "@/lib/utils";

export function LangSwitch({
  className,
  variant = "light",
  onSwitch,
}: {
  className?: string;
  variant?: "light" | "dark";
  onSwitch?: () => void;
}) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    onSwitch?.();

    const target = safePathFor(pathname);
    // `safePathFor` has resolved every parameterised template to a static
    // route, so what reaches `replace` never needs params.
    router.replace(target as Parameters<typeof router.replace>[0], {
      locale: next,
    });
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-full p-0.5",
        variant === "dark" ? "bg-white/10" : "bg-surface-muted",
        className
      )}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((option) => {
        const isActive = option === locale;

        return (
          <button
            key={option}
            type="button"
            onClick={() => switchTo(option)}
            aria-current={isActive ? "true" : undefined}
            aria-label={t("switchTo", { language: LOCALE_NAMES[option] })}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
              isActive
                ? variant === "dark"
                  ? "bg-white text-accent"
                  : "bg-primary text-white"
                : variant === "dark"
                  ? "text-white/60 hover:text-white"
                  : "text-text-muted hover:text-accent"
            )}
          >
            {LOCALE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
