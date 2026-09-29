import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { clientIp, hashIp } from "@/lib/rate-limit";
import { parseMessagePayload } from "@/lib/contact-message";
import { isBodyTooLarge, readJsonWithLimit } from "@/lib/request-size";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_WINDOW = 3;
const WINDOW_MINUTES = 60;

/**
 * Contact, feedback and content-error messages.
 *
 * The only writer of public.messages: the table has no insert policy, so the
 * checks here — honeypot, validation, rate limit — cannot be skipped by
 * talking to PostgREST directly.
 */
export async function POST(request: NextRequest) {
  if (isBodyTooLarge(request.headers)) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  const parsedBody = await readJsonWithLimit(request);
  if (!parsedBody.ok) {
    return parsedBody.reason === "too_large"
      ? NextResponse.json({ error: "payload_too_large" }, { status: 413 })
      : NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseMessagePayload(parsedBody.value);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  // Answer a bot with success so it does not learn to skip the field.
  if (parsed.honeypot) return NextResponse.json({ ok: true });

  const message = parsed.value;
  const admin = createAdminClient();

  // Throttle before the post lookup so probing non-existent ids costs quota.
  const { data: allowed, error: limitError } = await admin.rpc("consume_rate_limit", {
    p_scope: "message",
    p_key: hashIp(clientIp(request.headers)),
    p_limit: MAX_PER_WINDOW,
    p_window_minutes: WINDOW_MINUTES,
  });

  if (limitError) {
    console.error("[messages] rate limit failed", limitError.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  if (!allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  if (message.postId) {
    const { data: post } = await admin
      .from("posts")
      .select("id")
      .eq("id", message.postId)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  const { error } = await admin.from("messages").insert({
    kind: message.kind,
    name: message.name,
    email: message.email,
    body: message.body,
    post_id: message.postId,
    locale: message.locale,
  });

  if (error) {
    console.error("[messages] insert failed", error.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
