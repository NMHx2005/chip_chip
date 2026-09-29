"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clientIp, hashIp } from "@/lib/rate-limit";

export type LoginState = { error: string | null };

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

/**
 * Throttles password attempts per source address.
 *
 * GoTrue applies its own limits, but they are tuned for a whole project rather
 * than for a login form with a handful of legitimate users.
 *
 * "unavailable" is a deliberate fail-closed answer: if the limiter itself
 * cannot be consulted (RPC error), the attempt is refused rather than waved
 * through unthrottled. Missing service-role credentials are the one exception
 * — the limiter cannot exist without them, and blocking every admin login
 * would be worse than relying on GoTrue's own limits — so that case skips.
 */
type Attempt = "allow" | "deny" | "unavailable";

async function allowAttempt(): Promise<Attempt> {
  if (!isSupabaseAdminConfigured) return "allow";

  try {
    const { data } = await createAdminClient().rpc("consume_rate_limit", {
      p_scope: "login",
      p_key: hashIp(clientIp(headers())),
      p_limit: MAX_ATTEMPTS,
      p_window_minutes: WINDOW_MINUTES,
    });
    return data === false ? "deny" : "allow";
  } catch {
    return "unavailable";
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

  const attempt = await allowAttempt();
  if (attempt === "deny") {
    return {
      error: "Quá nhiều lần thử. Vui lòng đợi ít phút rồi đăng nhập lại.",
    };
  }
  if (attempt === "unavailable") {
    return {
      error: "Chưa kiểm tra được giới hạn đăng nhập. Vui lòng thử lại sau ít phút.",
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
