"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarBorderLayer } from "@/components/ui/StarBorder";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { EASE_STANDARD, STAR_SPEED } from "@/components/motion";

/** Primary action surface — matches the logo's purple → blue gradient. */
const brandGradient =
  "linear-gradient(131deg, #9B66F5 0%, #7B2FBE 42%, #2B2FA8 100%)";

const darkGradient =
  "linear-gradient(131deg, rgb(51, 51, 51) 0.79%, rgb(13, 13, 13) 35.22%, rgb(38, 38, 38) 99.16%)";

const GRADIENTS = { brand: brandGradient, dark: darkGradient } as const;

// The inner cover sits above the glow and hides it everywhere except this thin
// rim, so the shine reads as a border highlight instead of a halo.
const STAR_RIM = 1.5;

type Variant = "brand" | "dark" | "outline";
type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-11 pl-6 pr-4 text-sm gap-1.5",
  md: "h-11 pl-6 pr-4 text-sm gap-2",
  lg: "h-[52px] pl-5 pr-4 text-base gap-2",
};

const outlineBorderBg =
  "linear-gradient(#fff,#fff) padding-box, linear-gradient(206.97deg, rgba(123,47,190,0.28) 13.96%, rgba(43,47,168,0.18) 50.79%, rgba(123,47,190,0.28) 83.14%) border-box";

function useTapMotion(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) return {};
  return {
    whileTap: { scale: 0.97 },
    transition: { duration: 0.2, ease: EASE_STANDARD },
  };
}

/**
 * Shared visual state for one pill.
 *
 * The surface is always the *root* element (link or button) rather than an
 * inner span, so display utilities passed via `className` — `hidden`,
 * `md:inline-flex`, widths — actually control whether the pill is shown.
 */
function usePill(options: {
  variant: Variant;
  size: Size;
  showArrow: boolean;
  className?: string;
}) {
  const { variant, size, showArrow, className } = options;
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const isOutline = variant === "outline";
  const gradient = isOutline ? null : GRADIENTS[variant];

  const rootClassName = cn(
    "relative inline-flex cursor-pointer select-none items-center justify-center overflow-hidden rounded-3xl",
    isOutline ? "font-normal" : "font-medium text-white",
    sizeClasses[size],
    className
  );

  const rootStyle: React.CSSProperties = isOutline
    ? {
        border: "1.4px solid transparent",
        background: outlineBorderBg,
        boxShadow:
          "inset 0 2px 4px rgba(0,0,0,0.03), 0 1px 2px rgba(18,16,26,0.04)",
      }
    : {
        background: gradient!,
        boxShadow:
          "inset 0 2px 4px rgba(0,0,0,0.18), inset 0 -2px 4px rgba(255,255,255,0.22)",
      };

  const decorative = !isOutline && !prefersReducedMotion && (
    <>
      <StarBorderLayer
        color="rgba(255,255,255,0.95)"
        speed={hovered ? STAR_SPEED.hover : STAR_SPEED.idle}
      />
      <span
        aria-hidden
        className="absolute z-[1] rounded-[inherit]"
        style={{ inset: STAR_RIM, background: gradient! }}
      />
    </>
  );

  const arrow = showArrow ? (
    <ArrowRight
      className={cn(
        "relative z-[2] h-[18px] w-[18px] shrink-0",
        isOutline ? "text-brand-500/80" : "text-white/85"
      )}
      strokeWidth={2}
    />
  ) : null;

  const hoverHandlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  return {
    prefersReducedMotion,
    isOutline,
    rootClassName,
    rootStyle,
    decorative,
    arrow,
    hoverHandlers,
  };
}

function PillLabel({
  children,
  icon,
  isOutline,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isOutline: boolean;
}) {
  return (
    <>
      {icon && <span className="relative z-[2] shrink-0">{icon}</span>}
      <span className={cn("relative z-[2]", isOutline && "text-brand-700")}>
        {children}
      </span>
    </>
  );
}

export type PillButtonProps = {
  variant?: Variant;
  size?: Size;
  showArrow?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  /** Renders a locale-aware link instead of a button. */
  href?: StaticPathname;
};

export function PillButton({
  variant = "brand",
  size = "md",
  showArrow = true,
  icon,
  className,
  children,
  onClick,
  href,
}: PillButtonProps) {
  const pill = usePill({ variant, size, showArrow, className });
  const motionProps = useTapMotion(pill.prefersReducedMotion);

  const body = (
    <>
      {pill.decorative}
      <PillLabel icon={icon} isOutline={pill.isOutline}>
        {children}
      </PillLabel>
      {pill.arrow}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={pill.rootClassName}
        style={pill.rootStyle}
        {...pill.hoverHandlers}
      >
        {body}
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={pill.rootClassName}
      style={pill.rootStyle}
      {...motionProps}
      {...pill.hoverHandlers}
    >
      {body}
    </motion.button>
  );
}

/** Navbar / section CTA — same visual, always shows the arrow. */
export function PillButtonCta({
  className,
  children,
  showShadow = false,
  href,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  showShadow?: boolean;
  href?: StaticPathname;
  onClick?: () => void;
}) {
  const pill = usePill({
    variant: "brand",
    size: "md",
    showArrow: true,
    className: cn(showShadow && "shadow-[0_4px_0_rgba(61,21,96,0.35)]", className),
  });
  const motionProps = useTapMotion(pill.prefersReducedMotion);

  const body = (
    <>
      {pill.decorative}
      <PillLabel isOutline={false}>{children}</PillLabel>
      {pill.arrow}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={pill.rootClassName}
        style={pill.rootStyle}
        onClick={onClick}
        {...pill.hoverHandlers}
      >
        {body}
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={pill.rootClassName}
      style={pill.rootStyle}
      {...motionProps}
      {...pill.hoverHandlers}
    >
      {body}
    </motion.button>
  );
}
