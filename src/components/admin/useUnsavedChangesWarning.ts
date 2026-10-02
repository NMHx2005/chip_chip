"use client";

import { useEffect, useState } from "react";

/**
 * Warns before the writer leaves an article with unsaved changes.
 *
 * `beforeunload` covers tab close and reload and stays native — the browser
 * owns that prompt and a page cannot render during it. In-app navigation has
 * no route-change event in the App Router, so same-origin link clicks are
 * caught in the capture phase (the admin nav, the logo, any link) and the
 * click is cancelled while the caller shows a dialog.
 *
 * The caller owns the decision: render a dialog off `blockedHref`, then either
 * `cancelLeave()` to stay or navigate and then `cancelLeave()`.
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  const [blockedHref, setBlockedHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) {
      setBlockedHref(null);
      return;
    }

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

      // A dialog cannot be answered synchronously, so the navigation is always
      // held back; the dialog decides whether it happens.
      event.preventDefault();
      event.stopPropagation();
      setBlockedHref(`${url.pathname}${url.search}${url.hash}`);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  return {
    /** Where the writer tried to go, or null. */
    blockedHref,
    /** Drops the pending navigation — used both for "stay" and after leaving. */
    cancelLeave: () => setBlockedHref(null),
  };
}
