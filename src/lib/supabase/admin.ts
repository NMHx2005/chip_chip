import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Kept out of `@/lib/supabase/config` on purpose: that module is imported by
 * a client component (`@/lib/supabase/client`), and this file's `server-only`
 * guard means nothing can import it from there without breaking the build —
 * so this is the one place the service-role key's name can live without
 * reaching the browser bundle.
 */
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseAdminConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Service-role client. Bypasses Row Level Security, so it must only ever be
 * used inside a Route Handler or Server Action that has already validated the
 * request itself.
 *
 * The only current use is inserting comments in /api/comments, which is
 * deliberate: keeping the insert server-side means validation, rate limiting
 * and the author badge are applied before a row is written, and that
 * `author_email` never has to be readable by any client role.
 */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
