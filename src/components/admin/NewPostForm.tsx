"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TOPIC_IDS, TOPIC_TONE, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type PostKind } from "@/lib/types";
import { createPost } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";

const TOPIC_TITLE: Record<TopicId, string> = {
  "dinh-nghia": "Định nghĩa",
  "nguyen-ly": "Nguyên lý",
  "ung-dung": "Ứng dụng",
  "lich-su": "Lịch sử và Phát triển",
};

const DIFFICULTY_TITLE: Record<Difficulty, string> = {
  basic: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

export function NewPostForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<PostKind>("forum");
  const [topic, setTopic] = useState<TopicId>(TOPIC_IDS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("basic");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = readActionResult(
        await createPost({
          kind,
          topic: kind === "forum" ? null : topic,
          difficulty: kind === "forum" ? null : difficulty,
          title,
          slug,
        })
      );

      if (!result) return;

      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }

      if (!result.ok || !result.id) {
        setError(result.error ?? "Không tạo được bài viết.");
        return;
      }
      router.push(`/admin/bai-viet/${result.id}`);
    });
  };

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-text">Loại bài</legend>
        <div className="flex gap-2">
          {(
            [
              { value: "forum", label: "Blog" },
              { value: "lesson", label: "Bài học" },
              { value: "video", label: "Video" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={kind === option.value}
              className={cn(
                "cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                kind === option.value
                  ? "border-border bg-surface-muted text-accent"
                  : "border-border bg-surface text-text-nav hover:border-black/20"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {kind !== "forum" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-text">Chủ đề</legend>
          <div className="flex flex-wrap gap-2">
            {TOPIC_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTopic(id)}
                aria-pressed={topic === id}
                className="cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
                style={
                  topic === id
                    ? {
                        background: TOPIC_TONE[id].soft,
                        borderColor: TOPIC_TONE[id].bg,
                        color: TOPIC_TONE[id].text,
                      }
                    : undefined
                }
              >
                <span className={topic === id ? "" : "text-text-nav"}>
                  {TOPIC_TITLE[id]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {kind !== "forum" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-text">Độ khó</legend>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                aria-pressed={difficulty === level}
                className={cn(
                  "cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  difficulty === level
                    ? "border-border bg-surface-muted text-accent"
                    : "border-border bg-surface text-text-nav hover:border-black/20"
                )}
              >
                {DIFFICULTY_TITLE[level]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">
          Tiêu đề tiếng Việt
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          placeholder="Ví dụ: Transistor hoạt động như thế nào?"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">
          Đường dẫn{" "}
          <span className="font-normal text-text-muted">(để trống sẽ tự tạo)</span>
        </span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          placeholder="transistor-hoat-dong-nhu-the-nao"
        />
      </label>

      <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-xs leading-relaxed text-text-muted">
        Hệ thống tạo sẵn cả bản tiếng Việt và tiếng Anh. Bạn điền bản Việt trước,
        sau đó chuyển sang tab EN để dịch. Bài chỉ đăng được khi cả hai bản đều
        có tiêu đề và nội dung.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-60"
        >
          {pending ? "Đang tạo…" : "Tạo bài và bắt đầu viết"}
        </button>
      </div>
    </form>
  );
}
