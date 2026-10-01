import type { Ref } from "react";
import { Search } from "lucide-react";
import { HINT_COLORS } from "@/components/search/search-field-variants";
import { MAX_QUERY_LENGTH } from "@/lib/search-query";
import { cn } from "@/lib/utils";

/**
 * The search field (design "SearchField"): a plain GET to the search page, so
 * it works without JavaScript. No hooks, so the navbar (client) and the search
 * page (server) both render it. `inputId` is required so the visible label can
 * point at the input.
 */
export function SearchForm({
  action,
  label,
  placeholder,
  submitLabel,
  inputId,
  hint,
  labelHidden = false,
  defaultValue = "",
  inputRef,
  variant = "light",
  className,
}: {
  action: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  inputId: string;
  hint?: string;
  /** Hides the label, where the placeholder carries the meaning (the 404 panel). */
  labelHidden?: boolean;
  defaultValue?: string;
  inputRef?: Ref<HTMLInputElement>;
  variant?: "light" | "dark";
  className?: string;
}) {
  const dark = variant === "dark";

  return (
    <form method="get" action={action} role="search" className={cn("flex flex-col gap-2.5", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-xs font-bold uppercase tracking-[0.08em]",
          dark ? "text-[#D1D1D1]" : "text-text-muted",
          labelHidden && "sr-only"
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "flex h-[52px] items-center gap-2 rounded-full border pl-5 pr-1 transition-colors duration-fast ease-standard focus-within:outline focus-within:outline-2 focus-within:outline-offset-2",
          dark
            ? "border-white/50 bg-white/10 focus-within:border-white focus-within:outline-white [@media(hover:hover)]:hover:border-white/75"
            : "border-field bg-surface focus-within:border-primary focus-within:outline-accent [@media(hover:hover)]:hover:border-field-hover"
        )}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "h-11 min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden",
            dark ? "text-white placeholder:text-white/70" : "text-text placeholder:text-[#6B6B6B]"
          )}
        />
        <button
          type="submit"
          className={cn(
            "inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-[22px] text-sm font-semibold transition-colors duration-fast ease-standard active:scale-[0.98] motion-reduce:active:scale-100",
            dark ? "bg-white text-primary hover:bg-[#EFEFEF]" : "bg-primary text-white hover:bg-primary-hover"
          )}
        >
          <Search aria-hidden className="size-4 shrink-0" strokeWidth={2.2} />
          {submitLabel}
        </button>
      </div>
      {hint && (
        <p className={cn("text-[13px] leading-[1.5]", HINT_COLORS[variant].class)}>{hint}</p>
      )}
    </form>
  );
}
