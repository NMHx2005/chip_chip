import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { MessageActions } from "@/components/admin/MessageActions";
import { mailtoHref } from "@/lib/contact-message";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: "contact" | "feedback" | "content_error" | "volunteer" | "survey" | "webinar" | "competition";
  name: string;
  email: string | null;
  body: string;
  post_id: string | null;
  locale: "vi" | "en";
  is_handled: boolean;
  created_at: string;
};

const KIND_LABEL: Record<Row["kind"], string> = {
  contact: "Liên hệ",
  feedback: "Góp ý",
  content_error: "Báo lỗi nội dung",
  volunteer: "Đăng ký · Tình nguyện viên",
  survey: "Đăng ký · Khảo sát",
  webinar: "Đăng ký · Webinar",
  competition: "Đăng ký · Cuộc thi",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  await requireStaff();
  const supabase = createClient();
  const showAll = searchParams.filter === "all";

  // RLS lets only activated staff read this table, email included.
  let query = supabase
    .from("messages")
    .select("id, kind, name, email, body, post_id, locale, is_handled, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!showAll) query = query.eq("is_handled", false);

  const { data, error } = await query;
  const rows = (data ?? []) as Row[];

  const postIds = Array.from(new Set(rows.flatMap((r) => (r.post_id ? [r.post_id] : []))));
  const titles = new Map<string, string>();
  if (postIds.length > 0) {
    const { data: posts } = await supabase.from("posts").select("id, title").in("id", postIds);
    for (const post of posts ?? []) titles.set(post.id, post.title || "(chưa có tiêu đề)");
  }

  const tabs = [
    { href: "/admin/tin-nhan", label: "Chưa xử lý", active: !showAll },
    { href: "/admin/tin-nhan?filter=all", label: "Tất cả", active: showAll },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Tin nhắn</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Liên hệ, góp ý và báo lỗi nội dung từ người đọc.
        </p>
      </div>

      <nav className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              tab.active
                ? "border-border bg-surface-muted text-accent"
                : "border-border bg-surface text-text-nav hover:border-black/20"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
          Không đọc được hộp thư. Thử tải lại trang.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          {showAll ? "Chưa có tin nhắn nào." : "Không còn tin nào chờ xử lý."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className={
                row.is_handled
                  ? "flex gap-4 rounded-2xl border border-border bg-surface-muted p-5 opacity-70"
                  : "flex gap-4 rounded-2xl border border-border bg-surface p-5"
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-nav">
                    {KIND_LABEL[row.kind]}
                  </span>
                  <span className="text-sm font-semibold text-text">{row.name}</span>
                  <span className="text-[11px] uppercase text-text-muted">{row.locale}</span>
                  <time dateTime={row.created_at} className="text-xs text-text-muted">
                    {new Date(row.created_at).toLocaleString("vi-VN")}
                  </time>
                </div>

                {row.email && (
                  <a
                    href={mailtoHref(row.email)}
                    className="mt-0.5 block font-mono text-[11px] text-text-muted hover:text-accent"
                  >
                    {row.email}
                  </a>
                )}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-nav">
                  {row.body}
                </p>

                {row.post_id && (
                  <p className="mt-2 text-xs text-text-muted">
                    Về bài:{" "}
                    <Link
                      href={`/admin/bai-viet/${row.post_id}`}
                      className="text-text-nav underline hover:text-accent"
                    >
                      {titles.get(row.post_id) ?? "(bài đã bị xoá)"}
                    </Link>
                  </p>
                )}
              </div>

              <MessageActions messageId={row.id} handled={row.is_handled} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
