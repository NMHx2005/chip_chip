"use client";

import { useEffect } from "react";

/**
 * Warns before the writer leaves an article with unsaved changes.
 *
 * `beforeunload` covers tab close and reload. The App Router has no route
 * change event, so in-app navigation is caught by intercepting same-origin
 * link clicks during the capture phase (the admin nav, the logo, any link).
 * The native confirm is deliberately blocking: losing a half-written article
 * is worse than the interruption.
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome shows the prompt only when returnValue is set.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      if (
        !window.confirm(
          "Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi đó?"
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
