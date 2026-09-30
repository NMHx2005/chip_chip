"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A group of real radio inputs drawn as a segmented control. The chosen option
 * gets a black fill and a tick, so it is not told apart by colour alone. Below
 * `sm` the options share a two-column grid.
 */
export function RadioSegment<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  className,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className="mb-2 p-0 text-sm font-semibold leading-[1.4] text-primary">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-0.5 rounded-[20px] border border-border bg-surface p-1 sm:inline-flex sm:rounded-full">
        {options.map((option) => (
          <label key={option.value} className="relative block">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-3 text-sm font-medium text-text-nav transition-colors duration-fast ease-standard hover:bg-surface-muted peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-60 sm:rounded-full sm:px-5">
              {option.value === value && (
                <Check aria-hidden className="size-4" strokeWidth={2.5} />
              )}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
