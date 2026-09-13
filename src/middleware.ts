import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const intlMiddleware = createIntlMiddleware(routing);

const LOGIN_PATH = "/admin/dang-nhap";

/**
 * One middleware, two jobs.
 *
 * `next-intl` owns the public routes and must not see `/admin` or `/api` —
 * otherwise it rewrites `/admin` to `/vi/admin` and loops. Supabase session
 * refresh has to run everywhere, including `/admin`, so both systems share a
 * single response object and each writes its own cookies onto it.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isApi = pathname.startsWith("/api");

  const response =
    isAdmin || isApi
      ? NextResponse.next({ request })
      : intlMiddleware(request);

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Calling getUser() is what refreshes an expired session and rotates the
  // auth cookies. Do not remove it in favour of getSession(), which does not
  // verify the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdmin) return response;

  // Signing up is open, so a session alone proves nothing. The profile has to
  // be activated by an admin. Checking it here as well as in `requireStaff`
  // is what stops an activated-less account from bouncing between the login
  // page (which would send a logged-in user to /admin) and the guard (which
  // would send them straight back).
  let isStaff = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();
    isStaff = Boolean(profile?.is_active);
  }

  if (pathname !== LOGIN_PATH && !isStaff) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    if (user) loginUrl.searchParams.set("error", "not_staff");
    else loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === LOGIN_PATH && isStaff) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  // Everything except Next internals and static files. /admin and /api are
  // included here on purpose — the branch above keeps next-intl away from them.
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
