/**
 * Decides whether a locale's dirty flag may be cleared after a save.
 *
 * `saveAll` sends a locale's draft to the server, then `await`s the request.
 * The user can keep typing during that `await`: `updateDraft` bumps a
 * per-locale revision counter on every edit. If the counter that was current
 * when the request was *sent* still matches the counter *after* the request
 * resolves, nothing changed underneath the save and the locale is clean. If
 * it moved, the save shipped stale text and the locale must stay dirty so
 * the next `saveAll` picks up what was typed during the wait.
 *
 * Kept apart from the component so it can be unit-tested without React.
 */
export function shouldClearDirty(
  sentRevision: number,
  currentRevision: number
): boolean {
  return sentRevision === currentRevision;
}
