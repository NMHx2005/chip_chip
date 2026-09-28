"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TOPIC_IDS, TOPIC_TONE, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type PostKind, type VideoSource } from "@/lib/types";
import { saveSharedFields } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { PLATFORM_LABEL, parseVideoUrl } from "@/lib/video";

export type LessonOption = { translationId: string; title: string };

const SOURCE_TITLE: Record<VideoSource, string> = {
  own: "Tự làm",
  curated: "Tuyển chọn",
};

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
 * Edits the fields a lesson or video group shares — topic and difficulty, and
 * for a video its link, source, channel and related lesson. `saveSharedFields`
 * writes all of them in one UPDATE over both rows, so every field is always
 * sent, including the ones a lesson does not show.
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
  lessonOptions,
}: {
  translationId: string;
  kind: Extract<PostKind, "lesson" | "video">;
  initialTopic: TopicId | null;
  initialDifficulty: Difficulty | null;
  videoUrl: string;
  videoSource: VideoSource | null;
  channelName: string;
  relatedLessonTranslationId: string | null;
  lessonOptions: LessonOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState<TopicId | null>(initialTopic);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty);
  const [url, setUrl] = useState(videoUrl);
  const [source, setSource] = useState<VideoSource | null>(videoSource);
  const [channel, setChannel] = useState(channelName);
  const [related, setRelated] = useState<string | null>(relatedLessonTranslationId);

  // Read as the writer types, so a link the server would refuse is caught here.
  const parsedVideo = url.trim() ? parseVideoUrl(url) : null;
  const videoUnreadable = kind === "video" && url.trim().length > 0 && parsedVideo === null;
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = readActionResult(
        await saveSharedFields(translationId, {
          topic,
          difficulty,
          videoUrl: url,
          videoSource: source,
          channelName: channel,
          relatedLessonTranslationId: related,
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
      <h2 className="text-sm font-semibold text-text">
        {kind === "video" ? "Thông tin video" : "Chủ đề & độ khó"}
      </h2>

      {kind === "video" && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Link video</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=… hoặc link TikTok"
              aria-invalid={videoUnreadable}
              aria-describedby="video-link-status"
              className="h-11 rounded-xl border border-border bg-surface px-4 font-mono text-sm outline-none focus:border-black/30"
            />
            <span
              id="video-link-status"
              className={cn("text-xs", videoUnreadable ? "text-red-700" : "text-text-muted")}
            >
              {parsedVideo
                ? `${PLATFORM_LABEL[parsedVideo.platform]} · ${parsedVideo.externalId}`
                : videoUnreadable
                  ? "Không đọc được link. Dán link YouTube hoặc TikTok."
                  : "Chưa có link — bài video cần link mới đăng được."}
            </span>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-medium text-text-muted">Nguồn</legend>
            <div className="flex flex-wrap gap-2">
              {(["own", "curated"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  aria-pressed={source === value}
                  className={cn(
                    "cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                    source === value
                      ? "border-border bg-surface-muted text-accent"
                      : "border-border bg-surface text-text-nav hover:border-black/20"
                  )}
                >
                  {SOURCE_TITLE[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Tên kênh</span>
            <input
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              maxLength={120}
              placeholder="Ví dụ: Veritasium"
              className="h-11 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Bài học liên quan</span>
            <select
              value={related ?? ""}
              onChange={(event) => setRelated(event.target.value || null)}
              className="h-11 cursor-pointer rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-black/30"
            >
              <option value="">Không có</option>
              {related && !lessonOptions.some((lesson) => lesson.translationId === related) && (
                <option value={related}>(Bài học không còn tồn tại)</option>
              )}
              {lessonOptions.map((lesson) => (
                <option key={lesson.translationId} value={lesson.translationId}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

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
          disabled={pending || (kind === "lesson" && topic === null) || videoUnreadable}
          onClick={submit}
          className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : kind === "video" ? "Lưu thông tin video" : "Lưu chủ đề & độ khó"}
        </button>
      </div>
    </div>
  );
}
