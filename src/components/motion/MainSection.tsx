import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps the lower half of a page, covering the sticky backdrop above it.
 *
 * Deliberately carries no scroll-driven motion: translating a container that
 * holds several full sections costs a layer repaint per frame, and the effect
 * is not worth it.
 */
export function MainSection({
  children,
  transparent = false,
  className,
}: {
  children: ReactNode;
  /** Skip the gradient when a page-level backdrop should show through. */
  transparent?: boolean;
  className?: string;
}) {
  if (transparent) {
    return (
      <main className={cn("relative z-20 overflow-hidden", className)}>
        {children}
      </main>
    );
  }

  return (
    <main
      className={cn("relative z-20 overflow-hidden bg-bg", className)}
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(246,245,250,0) 0%, rgb(238,236,246) 30.9%, rgb(233,231,243) 45.7%, rgb(255,255,255) 100%)",
      }}
    >
      {children}
    </main>
  );
}
