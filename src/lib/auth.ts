import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type Staff = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "editor";
};

type StaffLookup =
  | { status: "ok"; staff: Staff }
  | { status: "anonymous" }
  | { status: "inactive" };

/**
 * Who is asking, without deciding what to do about it.
 *
 * Kept separate from `requireStaff` so Server Actions can ask the same
 * question without the redirect. See the note on `requireStaff`.
 */
export async function lookUpStaff(): Promise<StaffLookup> {
  if (!isSupabaseConfigured) return { status: "anonymous" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "anonymous" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // Signing up is open, so an account is not staff on its own.
  if (!profile?.is_active) return { status: "inactive" };

  return {
    status: "ok",
    staff: {
      id: user.id,
      email: user.email ?? "",
      displayName: profile.display_name || user.email || "",
      role: profile.role as "admin" | "editor",
    },
  };
}

/**
 * Server-side guard for every admin PAGE.
 *
 * middleware.ts already redirects anonymous visitors, but that check is a
 * convenience for the browser — this one runs next to the data and is the
 * check that actually protects it.
 *
 * Server Actions must use `lookUpStaff` instead. A redirect from an action
 * does not reach the browser as a navigation: the action's promise resolves
 * with `undefined`, the calling component either crashes reading `.ok` or
 * silently does nothing, and the reader is left staring at a form that appears
 * to have saved. Returning a value lets the component say what happened and go
 * to the login screen itself.
 */
export async function requireStaff(): Promise<Staff> {
  const result = await lookUpStaff();

  if (result.status === "ok") return result.staff;

  redirect(
    result.status === "inactive"
      ? "/admin/dang-nhap?error=not_staff"
      : "/admin/dang-nhap"
  );
}

