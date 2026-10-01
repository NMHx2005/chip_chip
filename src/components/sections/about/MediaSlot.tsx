import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** A 3:2 image slot with an optional credit pill (the About hero banner). */
export function MediaSlot({
  src,
  alt,
  sizes,
  credit,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  credit?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-full overflow-hidden rounded-3xl border border-border bg-surface-muted",
        className
      )}
    >
      <Image src={src} alt={alt} fill priority sizes={sizes} className="object-cover" />
      {credit && (
        <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-[rgba(13,13,13,0.72)] px-3 py-1.5 text-xs font-medium text-white">
          {credit}
        </span>
      )}
    </div>
  );
}
