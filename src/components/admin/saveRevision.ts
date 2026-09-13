import type { Locale } from "@/i18n/routing";

export type DirtyMap = Record<Locale, boolean>;

/** One locale queued to be sent, captured at the moment the plan is built. */
export type SavePlanEntry<TDraft> = {
  locale: Locale;
  draft: TDraft;
  /** The revision counter's value right now — the "sent" revision the
   *  eventual save result must be compared against in `applySaveResult`. */
  revision: number;
};

/**
 * Decides which locales should be sent to the server right now.
 *
 * A locale is included only if it is dirty *and* has a real database row
 * (`draft.id` non-empty — a locale missing its row must never be sent; see
 * PostEditor's missing-locale banner).
 *
 * Callers MUST pass the live dirty map, drafts and revision counters (refs
 * read at call time, never a value captured earlier in an async function).
 * `saveAll` is async and awaits one locale's save before moving to the
 * next: a snapshot taken once before the loop started would miss any
 * locale that became dirty while an earlier locale's request was in
 * flight, silently dropping it from the save. Calling `planSave` fresh for
 * each locale, right before it would be sent, is what closes that race.
 *
 * Kept apart from the component so it can be unit-tested without React.
 */
export function planSave<TDraft extends { id: string }>(
  locales: readonly Locale[],
  dirty: DirtyMap,
  drafts: Record<Locale, TDraft>,
  revisions: Record<Locale, number>
): SavePlanEntry<TDraft>[] {
  return locales
    .filter((locale) => dirty[locale] && drafts[locale].id !== "")
    .map((locale) => ({
      locale,
      draft: drafts[locale],
      revision: revisions[locale],
    }));
}

/**
 * Folds one locale's save result into the dirty map.
 *
 * Clears the locale's dirty flag only if its revision counter has not
 * moved since `sentRevision` — the value `planSave` captured right before
 * the request was sent. If it moved, the user typed into that locale while
 * the request was in flight, so the text just sent is already stale: the
 * locale is left dirty and untouched here, so the next save picks up what
 * was typed during the wait instead of marking it clean and losing it.
 *
 * Every other locale's flag is left exactly as given, so two locales
 * resolving independently never affect each other's flag.
 */
export function applySaveResult(
  dirty: DirtyMap,
  locale: Locale,
  sentRevision: number,
  currentRevision: number
): DirtyMap {
  if (sentRevision !== currentRevision) return dirty;
  return { ...dirty, [locale]: false };
}
