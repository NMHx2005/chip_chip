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

/** Server-only. Bypasses RLS — never import this into a client component. */
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const isSupabaseAdminConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
);

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
