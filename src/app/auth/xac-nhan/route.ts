import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  RECOVERY_COOKIE,
  RECOVERY_MAX_AGE_SECONDS,
  safeRedirectTarget,
} from "@/lib/account";

export const dynamic = "force-dynamic";

/**
 * Where the password-reset email lands.
 *
 * The link carries a one-time code (or, from an older mail template, a token
 * hash). Turning it into a session has to happen in a Route Handler: a Server
 * Component cannot write the session cookies, and without them the reset page
 * would have nothing to update.
 *
 * On success it also sets a short-lived marker cookie. That cookie is what
 * tells the reset page's session apart from an ordinary one — otherwise anyone
 * signed in could go to the reset page and set a new password without knowing
 * the current one.
 *
 * Any failure — a used link, an expired one, no code at all — sends the person
 * back to the login page with a flag, rather than to a form that cannot work.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const failure = new URL("/admin/dang-nhap?error=link", origin);

  if (!isSupabaseConfigured) return NextResponse.redirect(failure);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await supabase.auth.verifyOtp({
          type: (type ?? "recovery") as "recovery",
          token_hash: tokenHash,
        })
      : { error: new Error("missing code") };

  if (error) {
    console.error("[auth:xac-nhan]", error.message);
    return NextResponse.redirect(failure);
  }

  const destination = safeRedirectTarget(searchParams.get("next"), origin);

  const response = NextResponse.redirect(destination);
  response.cookies.set(RECOVERY_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: RECOVERY_MAX_AGE_SECONDS,
  });
  return response;
}
