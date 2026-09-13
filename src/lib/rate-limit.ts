import "server-only";

import { createHash } from "node:crypto";

/**
 * Client identification for rate limiting.
 *
 * `x-forwarded-for` is a list the client can seed: anything the browser sends
 * arrives as the *leftmost* entries, and each proxy appends the address it saw
 * to the right. Reading the leftmost entry therefore lets a bot mint a fresh
 * identity per request and walk straight past any limit.
 *
 * So the rightmost entries are the trustworthy ones, and how many of them to
 * skip depends on how many proxies sit in front of this app. One (the
 * platform's own edge) covers Vercel and a single nginx; set
 * TRUSTED_PROXY_HOPS if a CDN adds another, or `0` when the app is exposed
 * directly — with nothing rewriting the header, no value in it can be
 * believed, and every caller shares one bucket.
 */
const TRUSTED_PROXY_HOPS = Math.max(
  0,
  Math.trunc(Number(process.env.TRUSTED_PROXY_HOPS ?? "1")) || 0
);

/**
 * Salt for the IP digest.
 *
 * Falls back to the service role key so the limiter keeps working before
 * COMMENT_IP_SALT is set, but rotating that key would then reset every
 * counter — set the dedicated value in production.
 */
const IP_SALT =
  process.env.COMMENT_IP_SALT ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ||
  "chipchip-dev-salt";

export function clientIp(headers: Headers): string {
  // Set by Vercel's edge and not forwardable by the client.
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  // Nothing in front of the app rewrites forwarding headers, so none of them
  // mean anything. One shared bucket is a blunt limit, but it is a real one.
  if (TRUSTED_PROXY_HOPS === 0) return "direct";

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const chain = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const index = chain.length - TRUSTED_PROXY_HOPS;
    if (index >= 0 && chain[index]) return chain[index];
    // Shorter chain than configured — the request did not come through the
    // expected proxies, so no entry in it can be trusted.
    return "untrusted";
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Hash IPs before storing them.
 *
 * The raw address is never written: a salted digest is enough to count
 * requests from one source without keeping personal data around.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${IP_SALT}`).digest("hex");
}
