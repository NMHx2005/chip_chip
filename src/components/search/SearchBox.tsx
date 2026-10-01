"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SearchForm } from "@/components/search/SearchForm";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The magnifier in the desktop navbar. Pressing it reveals the search form
 * with the caret already in the field; Escape or a click outside closes it
 * and Escape hands focus back to the button. Below `lg` the form sits in the
 * mobile menu instead (see Navbar).
 */
export function SearchBox({ className }: { className?: string }) {
  const t = useTranslations("search");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        setOpen(false);
        buttonRef.current?.focus();
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("close") : t("open")}
        className="flex size-11 cursor-pointer items-center justify-center rounded-full text-text-nav transition-colors [@media(hover:hover)]:hover:bg-surface-muted [@media(hover:hover)]:hover:text-accent"
      >
        {open ? (
          <X className="size-[18px]" strokeWidth={2} aria-hidden />
        ) : (
          <Search className="size-[18px]" strokeWidth={2} aria-hidden />
        )}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-10 mt-2 w-[min(380px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-surface p-4 shadow-float"
      >
        <SearchForm
          action={getPathname({ href: "/tim-kiem", locale })}
          label={t("searchIn")}
          formLabel={t("searchIn")}
          hint={t("searchHint")}
          placeholder={t("placeholder")}
          submitLabel={t("submit")}
          inputId={inputId}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}
