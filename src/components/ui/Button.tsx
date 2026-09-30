import type { MouseEvent, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { FOCUS_RING, VARIANT_CLASSES, type ButtonVariant } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const BASE =
  "inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-full border border-transparent px-[22px] text-sm font-semibold transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] motion-reduce:active:scale-100";

// A busy button keeps focus, so it is marked with aria-disabled instead of the
// `disabled` attribute, and swallows the click itself.
const BUSY = "cursor-progress bg-disabled text-white hover:bg-disabled active:scale-100";

type Props = {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Trailing arrow, for actions that lead somewhere. */
  arrow?: boolean;
  /** Request in flight: dims the button and ignores clicks without dropping focus. */
  busy?: boolean;
  className?: string;
} & (
  | { href: StaticPathname; onClick?: never; type?: never }
  | {
      href?: undefined;
      onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
      type?: "button" | "submit";
    }
);

export function Button({
  children,
  variant = "primary",
  arrow = false,
  busy = false,
  className,
  href,
  onClick,
  type = "button",
}: Props) {
  const classes = cn(BASE, FOCUS_RING[variant].class, busy ? BUSY : VARIANT_CLASSES[variant], className);
  const content = (
    <>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4 shrink-0" strokeWidth={2} />}
    </>
  );

  if (href !== undefined) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={busy || undefined}
        onClick={busy ? (event) => event.preventDefault() : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      aria-disabled={busy || undefined}
      onClick={busy ? (event) => event.preventDefault() : onClick}
    >
      {content}
    </button>
  );
}
