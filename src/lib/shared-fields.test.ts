import { describe, expect, it } from "vitest";
import {
  buildSharedFieldsPatch,
  isUuid,
  validateNewPostFields,
  type SharedFieldsInput,
} from "@/lib/shared-fields";

const base: SharedFieldsInput = {
  topic: "nguyen-ly",
  difficulty: "basic",
  videoUrl: "",
  videoSource: null,
  channelName: "",
  relatedLessonTranslationId: null,
};

const LESSON_GROUP = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

describe("buildSharedFieldsPatch", () => {
  it("clears everything but nothing else for a blog post", () => {
    const result = buildSharedFieldsPatch("forum", {
      ...base,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
    });
    expect(result).toEqual({
      ok: true,
      patch: {
        topic: null,
        difficulty: null,
        video_platform: null,
        video_external_id: null,
        video_source: null,
        channel_name: null,
        related_lesson_translation_id: null,
      },
    });
  });

  it("requires a topic for a lesson", () => {
    expect(buildSharedFieldsPatch("lesson", { ...base, topic: null })).toEqual({
      ok: false,
      error: "Bài học cần chọn chủ đề.",
    });
  });

  it("keeps topic and difficulty for a lesson and drops video fields", () => {
    const result = buildSharedFieldsPatch("lesson", {
      ...base,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
      videoSource: "own",
    });
    expect(result.ok && result.patch).toMatchObject({
      topic: "nguyen-ly",
      difficulty: "basic",
      video_platform: null,
      video_external_id: null,
      video_source: null,
    });
  });

  it("turns a pasted link into platform and id for a video", () => {
    const result = buildSharedFieldsPatch("video", {
      ...base,
      topic: null,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s",
      videoSource: "curated",
      channelName: "  Asianometry  ",
      relatedLessonTranslationId: LESSON_GROUP,
    });
    expect(result).toEqual({
      ok: true,
      patch: {
        topic: null,
        difficulty: "basic",
        video_platform: "youtube",
        video_external_id: "dQw4w9WgXcQ",
        video_source: "curated",
        channel_name: "Asianometry",
        related_lesson_translation_id: LESSON_GROUP,
      },
    });
  });

  it("lets a video draft be saved before its link is known", () => {
    const result = buildSharedFieldsPatch("video", base);
    expect(result.ok && result.patch.video_external_id).toBeNull();
  });

  it("refuses a link it cannot read instead of storing nothing silently", () => {
    expect(
      buildSharedFieldsPatch("video", { ...base, videoUrl: "https://vimeo.com/123" })
    ).toEqual({
      ok: false,
      error: "Không đọc được đường dẫn video. Dán link YouTube hoặc TikTok.",
    });
  });

  it("rejects values a crafted request could send", () => {
    expect(
      buildSharedFieldsPatch("lesson", { ...base, topic: "hack" as never }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("lesson", { ...base, difficulty: "expert" as never }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("video", { ...base, videoSource: "stolen" as never }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("video", { ...base, relatedLessonTranslationId: "1; drop" }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("video", { ...base, channelName: "x".repeat(121) }).ok
    ).toBe(false);
  });
});

describe("validateNewPostFields", () => {
  it("clears topic and difficulty for a blog post", () => {
    expect(validateNewPostFields("forum", "nguyen-ly", "basic")).toEqual({
      ok: true,
      topic: null,
      difficulty: null,
    });
  });

  it("requires a topic for a lesson", () => {
    expect(validateNewPostFields("lesson", null, "basic")).toEqual({
      ok: false,
      error: "Bài học cần chọn chủ đề.",
    });
  });

  it("accepts a video without a topic", () => {
    expect(validateNewPostFields("video", null, "basic")).toEqual({
      ok: true,
      topic: null,
      difficulty: "basic",
    });
  });

  it("rejects values a crafted request could send", () => {
    expect(validateNewPostFields("hack" as never, null, null).ok).toBe(false);
    expect(validateNewPostFields("lesson", "hack" as never, "basic").ok).toBe(false);
    expect(validateNewPostFields("video", "nguyen-ly", "expert" as never).ok).toBe(false);
  });
});

describe("isUuid", () => {
  it("accepts a uuid and rejects a malformed translation id", () => {
    expect(isUuid(LESSON_GROUP)).toBe(true);
    expect(isUuid("")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(`${LESSON_GROUP}x`)).toBe(false);
  });
});
