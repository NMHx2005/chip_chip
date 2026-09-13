import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { clientIp, hashIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_WINDOW = 3;
const WINDOW_MINUTES = 10;
const MAX_BODY = 2000;
const MAX_NAME = 80;

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "server_not_configured" },
      { status: 503 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: a real reader never fills a field they cannot see. Answer with
  // success so the bot does not learn to skip it.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const postId = String(payload.postId ?? "").trim();
  const parentId = payload.parentId ? String(payload.parentId) : null;
  const body = String(payload.body ?? "").trim();
  let name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();

  if (!postId) {
    return NextResponse.json({ error: "missing_post" }, { status: 400 });
  }
  if (body.length < 1 || body.length > MAX_BODY) {
    return NextResponse.json({ error: "body_length" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Staff replies are attributed to the staff member and badged as official.
  // `is_active` is the check that matters: signing up is open, so merely
  // holding a session would otherwise be enough to wear the badge.
  let isPostAuthor = false;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_active) {
        isPostAuthor = true;
        name = profile.display_name?.trim() || name;
      }
    }
  } catch {
    // Anonymous reader — carry on with the submitted name.
  }

  if (name.length < 1 || name.length > MAX_NAME) {
    return NextResponse.json({ error: "name_length" }, { status: 400 });
  }
  if (!isPostAuthor && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email_invalid" }, { status: 400 });
  }

  // Only allow comments on articles the public can actually read.
  const { data: post } = await admin
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  if (parentId) {
    const { data: parent } = await admin
      .from("comments")
      .select("id, post_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    // Threads are one level deep. A reply to a reply would be written but
    // never rendered — `listComments` only joins replies onto root comments —
    // so it is rejected instead of silently disappearing.
    if (!parent || parent.post_id !== postId || parent.parent_id !== null) {
      return NextResponse.json({ error: "parent_not_found" }, { status: 400 });
    }
  }

  const { data: allowed, error: limitError } = await admin.rpc(
    "consume_rate_limit",
    {
      p_scope: "comment",
      p_key: hashIp(clientIp(request.headers)),
      p_limit: MAX_PER_WINDOW,
      p_window_minutes: WINDOW_MINUTES,
    }
  );

  if (limitError) {
    console.error("[comments] rate limit failed", limitError.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { data: inserted, error } = await admin
    .from("comments")
    .insert({
      post_id: postId,
      parent_id: parentId,
      author_name: name,
      author_email: isPostAuthor ? null : email || null,
      body,
      is_post_author: isPostAuthor,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[comments] insert failed", error.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
