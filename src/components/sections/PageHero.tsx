import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Shared opening block for interior pages.
 *
 * The homepage opens with a large, light, type-led hero; interior pages used
 * to open with a bare `<h1>`, which read as unfinished next to it. This gives
 * every page the same composure: an eyebrow chip, a balanced headline, a lead
 * paragraph, and room for a supporting slot (counts, a form, an action).
 *
 * Server-rendered. The four items (chip, title, lead, stats) rise in turn with
 * `.hero-in`; `--i` is the item's position and sets its delay. Under
 * `prefers-reduced-motion` the animation is switched off (globals.css).
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  stats,
  className,
  backdropImage,
  backdrop,
  below,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional supporting column (e.g. an action). Stats have their own prop. */
  children?: ReactNode;
  /** One to three figures shown in a card beside the title. */
  stats?: { value: string | number; label: string }[];
  className?: string;
  /** Path under `public/`; faded into the page background behind the text. */
  backdropImage?: string;
  /** Custom layer (e.g. `HeroBackdropLayer`) used instead of `backdropImage`; it draws its own scrim. */
  backdrop?: ReactNode;
  /** A row under the title block, such as a video credit. */
  below?: ReactNode;
}) {
  const hasBackdrop = Boolean(backdropImage || backdrop);

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
          {backdrop ?? (
            <>
              <Image
                src={backdropImage!}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-25"
              />
              {/* Left-to-right scrim keeps the title readable (flat on phones), then a fade into the page. */}
              <div className="absolute inset-0 bg-[rgba(229,229,229,.8)] md:bg-[linear-gradient(90deg,rgba(229,229,229,.92)_0%,rgba(229,229,229,.86)_55%,rgba(229,229,229,0)_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
            </>
          )}
        </div>
      )}
      <div className="relative mx-auto w-full max-w-content">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <header className="max-w-2xl">
            {eyebrow && (
              <p
                className="hero-in mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent"
                style={{ "--i": 0 } as CSSProperties}
              >
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate">{eyebrow}</span>
              </p>
            )}
            <h1
              className="hero-in text-balance text-h1 text-text md:text-h1-lg"
              style={{ "--i": 1 } as CSSProperties}
            >
              {title}
            </h1>
            {description && (
              <p
                className="hero-in mt-5 text-pretty text-base leading-relaxed text-text-muted md:text-lg"
                style={{ "--i": 2 } as CSSProperties}
              >
                {description}
              </p>
            )}
          </header>

          {stats && stats.length > 0 && <HeroStats stats={stats} />}
          {children}
        </div>
        {below && (
          <div className="hero-in mt-6" style={{ "--i": 4 } as CSSProperties}>
            {below}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Stats card: one to three figures in a single white card, divided by hairlines.
 * On phones the cells share the width equally so three still fit.
 */
export function HeroStats({
  stats,
}: {
  stats: { value: string | number; label: string }[];
}) {
  return (
    <dl
      className="hero-in grid w-full auto-cols-fr grid-flow-col rounded-2xl border border-border bg-surface py-3.5 sm:w-auto"
      style={{ "--i": 3 } as CSSProperties}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col-reverse gap-0.5 border-border px-4 first:border-l-0 sm:px-6 [&:not(:first-child)]:border-l"
        >
          <dt className="text-xs text-text-muted">{stat.label}</dt>
          <dd className="text-2xl font-extrabold leading-[1.1] tracking-[-0.02em] tabular-nums text-text">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** One-cell stats card; kept so pages that pass `<HeroStat/>` as children still work. */
export function HeroStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return <HeroStats stats={[{ value, label }]} />;
}
