import Image from "next/image";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-11", text: "text-sm" },
  lg: { box: "size-28 md:size-44", text: "text-4xl md:text-5xl" },
} as const;

/**
 * A round portrait: the photo when there is one, neutral initials otherwise —
 * a placeholder that looks like a real photo would claim more than we know.
 */
export function Avatar({
  photo,
  alt,
  name,
  size = "sm",
  className,
}: {
  photo: string | null;
  alt: string;
  /** Read for the initials fallback. */
  name: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { box, text } = SIZES[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-border bg-surface-muted",
        box,
        className
      )}
    >
      {photo ? (
        <Image
          src={photo}
          alt={alt}
          fill
          sizes={size === "lg" ? "(min-width: 768px) 176px, 112px" : "44px"}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "flex size-full items-center justify-center font-extrabold tracking-[-0.02em] text-text-nav",
            text
          )}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
