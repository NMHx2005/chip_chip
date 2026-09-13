import { cn } from "@/lib/utils";

/**
 * Text wordmark for Project Chíp Chíp.
 *
 * The artwork is drawn with type rather than shipped as an image so it stays
 * crisp at any size and needs no transparent PNG. The whole mark scales from
 * the wrapper's font-size — everything inside is em-based.
 *
 * Replace with the real vector logo once the design team exports one, keeping
 * the same `className` contract.
 */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  /** Drops the "PROJECT" line for tight spaces. */
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex select-none flex-col items-center",
        className
      )}
      role="img"
      aria-label="Project Chíp Chíp"
    >
      {!compact && (
        <span className="flex w-full items-center gap-[0.5em] text-[0.28em] font-bold uppercase leading-none tracking-[0.4em] text-text">
          <span aria-hidden className="h-px flex-1 bg-current opacity-55" />
          <span className="pl-[0.4em]">Project</span>
          <span aria-hidden className="h-px flex-1 bg-current opacity-55" />
        </span>
      )}

      <span className="text-gradient-brand mt-[0.1em] text-[1em] font-extrabold uppercase leading-[0.92] tracking-[-0.02em]">
        Chíp Chíp
      </span>
    </span>
  );
}
