import { headers } from "next/headers";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { clientIp, hashIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

/**
 * Throttles password attempts per source address.
 *
 * Used by the login form and by the "current password" check on the
 * change-password form — both are places where a password can be guessed, and
 * both count against the same window, so moving between them buys no extra
 * tries. GoTrue applies its own limits, but they are tuned for a whole project
 * rather than for a form with a handful of legitimate users.
 *
 * "unavailable" is a deliberate fail-closed answer: if the limiter itself
 * cannot be consulted (an RPC error), the attempt is refused rather than waved
 * through unthrottled. Missing service-role credentials are the one exception —
 * the limiter cannot exist without them, and blocking every admin login would
 * be worse than relying on GoTrue's own limits — so that case skips.
 */
export type LoginAttempt = "allow" | "deny" | "unavailable";

export async function allowLoginAttempt(): Promise<LoginAttempt> {
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
