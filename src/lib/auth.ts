import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Server-side guard for every admin page.
 *
 * middleware.ts already redirects anonymous visitors, but that check is a
 * convenience for the browser — this one runs next to the data and is the
 * check that actually protects it. Server Actions call it too.
 *
 * An auth account is not staff on its own: the profile must be activated by an
 * existing admin. Signing up is open, so without `is_active` anyone could
 * register and reach the CMS.
 */
export async function requireStaff() {
  if (!isSupabaseConfigured) {
    redirect("/admin/dang-nhap");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/dang-nhap");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect("/admin/dang-nhap?error=not_staff");

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile.display_name || user.email || "",
    role: profile.role as "admin" | "editor",
  };
}
