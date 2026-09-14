"use client";

import { useEffect } from "react";

/**
 * Keeps `<html lang>` in step with the active locale.
 *
 * The `<html>` element belongs to the root layout, which sits above the
 * `[locale]` segment. Layouts are preserved across a soft navigation, so that
 * one is never re-rendered when the reader switches language — its `lang`
 * attribute would keep whatever the page was first loaded with. Assistive tech
 * reads that attribute to choose a pronunciation, so a stale value is worse
 * than none.
 *
 * The root layout still renders the correct value on a hard load; this only
 * covers the client-side switch.
 */
export function DocumentLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
