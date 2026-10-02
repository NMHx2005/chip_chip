"use server";

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clientIp, hashIp } from "@/lib/rate-limit";
import { allowLoginAttempt } from "@/lib/login-throttle";
import { RECOVERY_COOKIE, validatePasswordChange } from "@/lib/account";
import { SITE_URL } from "@/lib/site";

export type ResetRequestState = { sent: boolean; error: string | null };
export type PasswordState = { error: string | null; ok: boolean };

const RESET_LIMIT = 5;
const RESET_WINDOW_MINUTES = 30;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where Supabase sends the person after they click the link in the email. */
function resetRedirect(origin: string): string {
  return `${origin}/auth/xac-nhan?next=/admin/dat-lai-mat-khau`;
}

/**
 * Sends a password-reset link.
 *
 * The answer never depends on whether the address has an account — the same
 * notice either way, so this form cannot be used to look for staff emails.
 * A failure to send is logged for the maintainer, not shown to the visitor.
 */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  if (!isSupabaseConfigured) {
    return { sent: false, error: "Supabase chưa được cấu hình. Xem .env.example." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { sent: false, error: "Email không hợp lệ." };

  // Throttled like the login form: without it this endpoint mails on demand.
  if (isSupabaseAdminConfigured) {
    try {
      const { data } = await createAdminClient().rpc("consume_rate_limit", {
        p_scope: "reset",
        p_key: hashIp(clientIp(headers())),
        p_limit: RESET_LIMIT,
        p_window_minutes: RESET_WINDOW_MINUTES,
      });
      if (data === false) {
        return {
          sent: false,
          error: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau ít phút.",
        };
      }
    } catch {
      return { sent: false, error: "Chưa kiểm tra được giới hạn. Vui lòng thử lại sau." };
    }
  }

  const origin = headers().get("origin") ?? SITE_URL;
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect(origin),
    });
    // Logged, never surfaced: the message would leak whether the address exists.
    if (error) console.error("[admin:requestPasswordReset]", error.message);
  } catch (error) {
    console.error("[admin:requestPasswordReset]", error);
  }

  return { sent: true, error: null };
}

/**
 * Sets a new password for whoever is signed in.
 *
 * Two situations, and the server decides which — never the submitted form:
 *
 * - The reset link's callback left a short-lived marker cookie, so this is the
 *   person who proved control of the mailbox; no current password to ask for.
 * - Anything else is an ordinary session, where the current password is
 *   required. That is what keeps someone walking past an unlocked laptop from
 *   locking the owner out, and it is why "signed in" alone is not enough to
 *   open the reset form (see the reset page).
 */
export async function setNewPassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  if (!isSupabaseConfigured) {
    return { error: "config", ok: false };
  }

  const store = cookies();
  const fromResetLink = store.get(RECOVERY_COOKIE)?.value === "1";

  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const problem = validatePasswordChange({
    password,
    confirm,
    current,
    requireCurrent: !fromResetLink,
  });
  if (problem) return { error: problem, ok: false };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { error: "no_session", ok: false };

  if (!fromResetLink) {
    // Throttled like the login form. Without this, holding a session would turn
    // this page into an offline speed-run of the current password.
    const attempt = await allowLoginAttempt();
    if (attempt === "deny") return { error: "too_many", ok: false };
    if (attempt === "unavailable") return { error: "throttle_unavailable", ok: false };

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (verifyError) return { error: "current_wrong", ok: false };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Anything else (a reused password, a server limit) is a failed change.
    return { error: "update_failed", ok: false };
  }

  // Spent: one reset link, one change.
  if (fromResetLink) store.set(RECOVERY_COOKIE, "", { path: "/", maxAge: 0 });

  return { error: null, ok: true };
}
