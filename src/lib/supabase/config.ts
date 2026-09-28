/**
 * Supabase configuration.
 *
 * Read through this module rather than `process.env` directly so the rest of
 * the app can keep working — with empty results — before a Supabase project is
 * wired up. That keeps `npm run build` passing on a fresh clone.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// The service-role key, and `isSupabaseAdminConfigured` derived from it, live
// in `@/lib/supabase/admin` (a `server-only` module) instead of here: this
// file is imported by `@/lib/supabase/client`, a client component, and even
// an unused `process.env.SUPABASE_SERVICE_ROLE_KEY` reference here would put
// that env var's name in the browser bundle.

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let warned = false;

/** Returns false (and warns once) when the project has no Supabase env vars. */
export function requireSupabase(scope: string): boolean {
  if (isSupabaseConfigured) return true;

  if (!warned) {
    warned = true;
    console.warn(
      `[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — ` +
        `${scope} will render empty. See .env.example.`
    );
  }
  return false;
}
