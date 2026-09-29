import type { ReactNode } from "react";
import Image from "next/image";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { cn } from "@/lib/utils";

/**
 * Shared opening block for interior pages.
 *
 * The homepage opens with a large, light, type-led hero; interior pages used
 * to open with a bare `<h1>`, which read as unfinished next to it. This gives
 * every page the same composure: an eyebrow chip, a balanced headline, a lead
 * paragraph, and room for a supporting slot (counts, a form, an action).
 *
 * Server-rendered; the only motion is a one-off CSS rise, which the global
 * `prefers-reduced-motion` rule neutralises.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  backdropImage,
  backdropVideo,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional supporting column (e.g. stats or an action). */
  children?: ReactNode;
  className?: string;
  /** Path under `public/`; faded into the page background behind the text. */
  backdropImage?: string;
  /** Muted looping clip used instead of `backdropImage`. */
  backdropVideo?: string;
}) {
  const hasBackdrop = Boolean(backdropImage || backdropVideo);

  return (
    <section
      className={cn(
        "px-5 pt-12 md:px-8 md:pt-16",
        hasBackdrop && "relative overflow-hidden pb-10 md:pb-14",
        className
      )}
    >
      {hasBackdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {backdropVideo ? (
            <AutoplayVideo src={backdropVideo} eager className="opacity-25" />
          ) : (
            <Image
              src={backdropImage!}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-25"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
        </div>
      )}
      <div className="relative mx-auto w-full max-w-content">
        <div className="rise-in flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <header className="max-w-2xl">
            {eyebrow && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                {eyebrow}
              </p>
            )}
            <h1 className="text-balance text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text md:text-[46px]">
              {title}
            </h1>
            {description && (
              <p className="mt-5 text-pretty text-base leading-relaxed text-text-muted md:text-lg">
                {description}
              </p>
            )}
          </header>

          {children}
        </div>
      </div>
    </section>
  );
}

/** Small numeric chip for the hero's supporting column. */
export function HeroStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="text-xl font-extrabold tabular-nums text-text">
        {value}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
