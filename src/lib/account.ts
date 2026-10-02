/** Shortest password the admin accepts. Supabase's own floor is 6. */
export const MIN_PASSWORD_LENGTH = 8;

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
