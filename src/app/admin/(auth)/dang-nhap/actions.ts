"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { clientIp, hashIp } from "@/lib/rate-limit";

export type LoginState = { error: string | null };

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

/**
 * Throttles password attempts per source address.
 *
 * GoTrue applies its own limits, but they are tuned for a whole project rather
 * than for a login form with a handful of legitimate users. Returns false when
 * the caller has spent their allowance; missing service-role credentials skip
 * the check rather than locking staff out.
 */
async function allowAttempt(): Promise<boolean> {
  if (!isSupabaseAdminConfigured) return true;

  try {
    const { data } = await createAdminClient().rpc("consume_rate_limit", {
      p_scope: "login",
      p_key: hashIp(clientIp(headers())),
      p_limit: MAX_ATTEMPTS,
      p_window_minutes: WINDOW_MINUTES,
    });
    return data !== false;
  } catch {
    return true;
  }
}

export async function signIn(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase chưa được cấu hình. Xem .env.example." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu." };
  }

  if (!(await allowAttempt())) {
    return {
      error: "Quá nhiều lần thử. Vui lòng đợi ít phút rồi đăng nhập lại.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately vague: do not reveal whether the address exists.
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}
