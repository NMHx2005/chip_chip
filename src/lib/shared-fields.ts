import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type PostKind, type VideoSource } from "@/lib/types";
import { parseVideoUrl, type VideoPlatform } from "@/lib/video";

/**
 * Fields a translation group shares: the VI and EN rows must hold the same
 * values, and publish_translation refuses a group where they differ. They are
 * therefore written by one UPDATE over the whole group, never per row.
 *
 * Pure so it can be tested without a database; the Server Action is a thin
 * shell around it. The action is a public HTTP endpoint, so every value is
 * checked here even though the editor only ever sends valid ones.
 */

export type SharedFieldsInput = {
  topic: TopicId | null;
  difficulty: Difficulty | null;
  videoUrl: string;
  videoSource: VideoSource | null;
  channelName: string;
  relatedLessonTranslationId: string | null;
};

export type SharedFieldsPatch = {
  topic: TopicId | null;
  difficulty: Difficulty | null;
  video_platform: VideoPlatform | null;
  video_external_id: string | null;
  video_source: VideoSource | null;
  channel_name: string | null;
  related_lesson_translation_id: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CHANNEL = 120;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

type Result = { ok: true; patch: SharedFieldsPatch } | { ok: false; error: string };

const EMPTY: SharedFieldsPatch = {
  topic: null,
  difficulty: null,
  video_platform: null,
  video_external_id: null,
  video_source: null,
  channel_name: null,
  related_lesson_translation_id: null,
};

/**
 * `published` gates clearing `difficulty` once a group is live: without it, a
 * lesson or video that already passed publish_translation's difficulty check
 * could have that field wiped here afterwards, leaving a published article
 * with no difficulty shown. Defaults to false so every other caller (new
 * drafts, callers that don't know the group's status) is unaffected.
 */
export function buildSharedFieldsPatch(
  kind: PostKind,
  input: SharedFieldsInput,
  published = false
): Result {
  if (kind === "forum") return { ok: true, patch: EMPTY };

  if (input.topic !== null && !TOPIC_IDS.includes(input.topic)) {
    return { ok: false, error: "Chủ đề không hợp lệ." };
  }
  if (input.difficulty !== null && !DIFFICULTIES.includes(input.difficulty)) {
    return { ok: false, error: "Độ khó không hợp lệ." };
  }
  if (published && input.difficulty === null) {
    return { ok: false, error: "Bài đã đăng cần giữ độ khó." };
  }

  if (kind === "lesson") {
    if (input.topic === null) return { ok: false, error: "Bài học cần chọn chủ đề." };
    return {
      ok: true,
      patch: { ...EMPTY, topic: input.topic, difficulty: input.difficulty },
    };
  }

  // kind === "video"
  if (input.videoSource !== null && input.videoSource !== "own" && input.videoSource !== "curated") {
    return { ok: false, error: "Nguồn video không hợp lệ." };
  }

  const channel = input.channelName.trim();
  if (channel.length > MAX_CHANNEL) {
    return { ok: false, error: `Tên kênh tối đa ${MAX_CHANNEL} ký tự.` };
  }

  const related = input.relatedLessonTranslationId;
  if (related !== null && !isUuid(related)) {
    return { ok: false, error: "Bài học liên quan không hợp lệ." };
  }

  const url = input.videoUrl.trim();
  const ref = url ? parseVideoUrl(url) : null;
  if (url && !ref) {
    return { ok: false, error: "Không đọc được đường dẫn video. Dán link YouTube hoặc TikTok." };
  }

  return {
    ok: true,
    patch: {
      topic: input.topic,
      difficulty: input.difficulty,
      video_platform: ref?.platform ?? null,
      video_external_id: ref?.externalId ?? null,
      video_source: input.videoSource,
      channel_name: channel || null,
      related_lesson_translation_id: related,
    },
  };
}

const POST_KINDS: readonly PostKind[] = ["lesson", "forum", "video"];

type NewPostFieldsResult =
  | { ok: true; topic: TopicId | null; difficulty: Difficulty | null }
  | { ok: false; error: string };

/**
 * Validates the fields `createPost` writes on row creation.
 *
 * `createPost` is a public HTTP endpoint, so `kind`/`topic`/`difficulty` are
 * checked here rather than trusted to the DB's enum types and CHECK
 * constraints, which would otherwise be the only thing standing between a
 * crafted request and a raw Postgres error surfacing to the caller.
 */
export function validateNewPostFields(
  kind: PostKind,
  topic: TopicId | null,
  difficulty: Difficulty | null
): NewPostFieldsResult {
  if (!POST_KINDS.includes(kind)) {
    return { ok: false, error: "Loại bài không hợp lệ." };
  }

  if (kind === "forum") {
    return { ok: true, topic: null, difficulty: null };
  }

  if (topic !== null && !TOPIC_IDS.includes(topic)) {
    return { ok: false, error: "Chủ đề không hợp lệ." };
  }
  if (difficulty !== null && !DIFFICULTIES.includes(difficulty)) {
    return { ok: false, error: "Độ khó không hợp lệ." };
  }

  if (kind === "lesson" && topic === null) {
    return { ok: false, error: "Bài học cần chọn chủ đề." };
  }

  return { ok: true, topic, difficulty };
}

/**
 * Whether a translation group may be published, mirroring `publish_translation`
 * in the database: both locales present, each with a title and at least one
 * body block.
 *
 * The admin list uses this to enable its "Đăng" button. Checking titles alone
 * (the earlier behaviour) left the button clickable on a body-less group,
 * which then failed only when the server-side gate refused it.
 */
export function isTranslationGroupReady(
  rows: readonly { locale: string; title: string; content: unknown }[]
): boolean {
  const locales = new Set(rows.map((row) => row.locale));
  if (!locales.has("vi") || !locales.has("en")) return false;

  return rows.every((row) => {
    const blocks = (row.content as { content?: unknown[] } | null)?.content;
    return row.title.trim().length > 0 && Array.isArray(blocks) && blocks.length > 0;
  });
}
