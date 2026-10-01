export type ChipVariant = "empty" | "notFound" | "error";

/** Drawn chip, the shared picture for empty and error states. Decorative. */
export function ChipArt({
  variant = "empty",
  className,
}: {
  variant?: ChipVariant;
  className?: string;
}) {
  return (
    <svg
      width="120"
      height="96"
      viewBox="0 0 120 96"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="20" y="8" width="80" height="80" rx="16" stroke="#8C8C8C" strokeWidth="2" strokeDasharray="5 5" />
      <g stroke="#4D4D4D" strokeWidth="2" strokeLinecap="round">
        <path d="M24 34h10M24 48h10M24 62h10M86 34h10M86 48h10M86 62h10M46 12v8M60 12v8M74 12v8M46 76v8M60 76v8M74 76v8" />
      </g>
      <rect x="34" y="20" width="52" height="56" rx="10" fill="#fff" stroke="#0D0D0D" strokeWidth="2" />
      {variant === "empty" ? (
        <rect x="46" y="34" width="28" height="28" rx="5" fill="#EFEFEF" stroke="#4D4D4D" strokeWidth="2" />
      ) : (
        <text
          x="60"
          y="49"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-be-vietnam-pro), sans-serif"
          fontSize={variant === "notFound" ? 18 : 30}
          fontWeight="800"
          fill="#0D0D0D"
        >
          {variant === "notFound" ? "404" : "!"}
        </text>
      )}
    </svg>
  );
}
