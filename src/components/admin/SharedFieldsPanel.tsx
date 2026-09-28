"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TOPIC_IDS, TOPIC_TONE, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type PostKind, type VideoSource } from "@/lib/types";
import { saveSharedFields } from "@/app/admin/actions";
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

/**
 * Edits topic and difficulty for a lesson or video group — the only place
 * that can, so a pre-DA1 lesson with `difficulty = null` can be republished.
 *
 * For `kind = "video"` the video link/source/channel/related-lesson fields
 * are passed through unchanged (`videoUrl` etc. below): editing them is DA2's
 * job, but `saveSharedFields` writes the whole shared-fields row in one
 * UPDATE, so this panel must resend the group's current values or it would
 * silently clear them.
 */
export function SharedFieldsPanel({
  translationId,
  kind,
  initialTopic,
  initialDifficulty,
  videoUrl,
  videoSource,
  channelName,
  relatedLessonTranslationId,
}: {
  translationId: string;
  kind: Extract<PostKind, "lesson" | "video">;
  initialTopic: TopicId | null;
  initialDifficulty: Difficulty | null;
  videoUrl: string;
  videoSource: VideoSource | null;
  channelName: string;
  relatedLessonTranslationId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState<TopicId | null>(initialTopic);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = readActionResult(
        await saveSharedFields(translationId, {
          topic,
          difficulty,
          videoUrl,
          videoSource,
          channelName,
          relatedLessonTranslationId,
        })
      );

      if (!result) return;

      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }

      if (!result.ok) {
        setMessage({ kind: "error", text: result.error ?? "Không lưu được." });
        return;
      }

      setMessage({ kind: "ok", text: "Đã lưu." });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text">Chủ đề &amp; độ khó</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-text-muted">Chủ đề</legend>
        <div className="flex flex-wrap gap-2">
          {kind === "video" && (
            <button
              type="button"
              onClick={() => setTopic(null)}
              aria-pressed={topic === null}
              className={cn(
                "cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                topic === null
                  ? "border-border bg-surface-muted text-accent"
                  : "border-border bg-surface text-text-nav hover:border-black/20"
              )}
            >
              Không chọn
            </button>
          )}
          {TOPIC_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTopic(id)}
              aria-pressed={topic === id}
              className="cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors"
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
              <span className={topic === id ? "" : "text-text-nav"}>{TOPIC_TITLE[id]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-text-muted">Độ khó</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
              className={cn(
                "cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
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

      {message && (
        <p
          role="status"
          className={cn(
            "rounded-xl border px-3.5 py-2.5 text-sm",
            message.kind === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {message.text}
        </p>
      )}

      <div>
        <button
          type="button"
          disabled={pending || (kind === "lesson" && topic === null)}
          onClick={submit}
          className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu chủ đề & độ khó"}
        </button>
      </div>
    </div>
  );
}
