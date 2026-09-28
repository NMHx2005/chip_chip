import type { Ref } from "react";
import { Search } from "lucide-react";
import { MAX_QUERY_LENGTH } from "@/lib/search-query";
import { cn } from "@/lib/utils";

/**
 * The search form: a plain GET to the search page, so it works without
 * JavaScript. No hooks, so the navbar (client) and the search page (server)
 * both render it.
 */
export function SearchForm({
  action,
  label,
  placeholder,
  submitLabel,
  defaultValue = "",
  inputRef,
  variant = "light",
}: {
  action: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  defaultValue?: string;
  inputRef?: Ref<HTMLInputElement>;
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";

  return (
    <form method="get" action={action} role="search" className="flex items-center gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "h-11 w-full rounded-xl border px-3.5 text-base outline-none md:text-sm",
            dark
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-white/50 focus-visible:ring-2 focus-visible:ring-white"
              : "border-border bg-surface text-text placeholder:text-text-muted focus:border-black/40 focus-visible:ring-2 focus-visible:ring-accent"
          )}
        />
      </label>
      <button
        type="submit"
        className={cn(
          "flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors",
          dark ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:bg-black/80"
        )}
      >
        <Search className="size-4" strokeWidth={2.2} aria-hidden />
        {submitLabel}
      </button>
    </form>
  );
}
