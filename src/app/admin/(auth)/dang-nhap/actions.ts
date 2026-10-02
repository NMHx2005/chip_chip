"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { allowLoginAttempt } from "@/lib/login-throttle";

export type LoginState = { error: string | null };

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

  const attempt = await allowLoginAttempt();
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
