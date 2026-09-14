import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps the lower half of a page, covering the sticky backdrop above it.
 *
 * Deliberately carries no scroll-driven motion: translating a container that
 * holds several full sections costs a layer repaint per frame, and the effect
 * is not worth it.
 *
 * Renders a `<div>`, not a `<main>`: this is a purely visual wrapper (the
 * gradient that covers the sticky backdrop), and every page that uses it
 * already has its own page-level `<main>` landmark. HTML forbids nesting
 * `<main>` inside `<main>`, and a second landmark would confuse assistive
 * tech regardless.
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
      <div className={cn("relative z-20 overflow-hidden", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("relative z-20 overflow-hidden bg-bg", className)}
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(242,242,242,0) 0%, rgb(224,224,224) 30.945%, rgb(215,215,215) 45.719%, rgb(255,255,255) 100%)",
      }}
    >
      {children}
    </div>
  );
}
