/**
 * Normalises what a Server Action hands back to the browser.
 *
 * An action that hits `redirect()` resolves the caller's promise with
 * `undefined` instead of its return value: Next answers the POST with a 307
 * and there is nothing left to return. That is what the admin actions used to
 * do on an expired session, and it cost two bugs at once — reading `.ok` off
 * `undefined` raised "Cannot read properties of undefined", which the admin
 * error boundary reported as a broken Supabase connection; and when that was
 * guarded, the click instead did nothing at all, because a redirect out of an
 * action never reaches the browser as a navigation.
 *
 * The actions now return `SESSION_ENDED` and never redirect, so this is a
 * safety net rather than the main path: `null` means "assume the app is
 * navigating away — do not set state, do not show an error".
 */
export function readActionResult<T extends { ok: boolean }>(
  result: T | undefined
): T | null {
  return result ?? null;
}

/**
 * The action refused because the staff session is gone.
 *
 * Callers send the reader to the login screen themselves — the action
 * deliberately does not redirect (see `requireStaff` in lib/auth.ts).
 */
export function sessionExpired(result: {
  ok: boolean;
  unauthorized?: boolean;
} | null): boolean {
  return result?.unauthorized === true;
}
