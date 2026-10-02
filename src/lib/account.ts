/** Shortest password the admin accepts. Supabase's own floor is 6. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Marks the session that came from the reset email, valid for a few minutes.
 *
 * Without it, "signed in" would be enough to open the reset page and set a new
 * password without knowing the current one — which is exactly the protection
 * the change-password form exists to provide. A cookie set by the callback is
 * what tells the two situations apart, since both are just a session.
 */
export const RECOVERY_COOKIE = "chip-chip-pw-recovery";
export const RECOVERY_MAX_AGE_SECONDS = 900;

/** Where the reset page lives, used as the destination of last resort. */
export const RESET_PASSWORD_PATH = "/admin/dat-lai-mat-khau";

/**
 * The page to land on after the emailed link is exchanged.
 *
 * `next` travels through an email, so it is attacker-controlled in the general
 * case: only a same-origin target is followed. `//evil.example` and
 * `https://evil.example` both resolve to another origin and are dropped — this
 * is why the check is on the parsed URL's origin rather than on the string's
 * first characters.
 */
export function safeRedirectTarget(next: string | null | undefined, origin: string): URL {
  const fallback = new URL(RESET_PASSWORD_PATH, origin);
  if (!next) return fallback;

  try {
    const requested = new URL(next, origin);
    return requested.origin === origin ? requested : fallback;
  } catch {
    return fallback;
  }
}

/** What is wrong with a new password, as a code the form turns into words. */
export type PasswordProblem =
  | "current_required"
  | "password_short"
  | "password_unchanged"
  | "confirm_mismatch";

/**
 * Checks a password change before it is sent.
 *
 * `requireCurrent` is for changing a password while signed in — it also asks
 * for the current one, which is what stops someone walking past an open
 * laptop from locking the owner out.
 */
export function validatePasswordChange(input: {
  password: string;
  confirm: string;
  current?: string;
  requireCurrent?: boolean;
}): PasswordProblem | null {
  if (input.requireCurrent && !input.current?.trim()) return "current_required";
  if (input.password.length < MIN_PASSWORD_LENGTH) return "password_short";
  if (input.requireCurrent && input.current === input.password) return "password_unchanged";
  if (input.password !== input.confirm) return "confirm_mismatch";
  return null;
}
