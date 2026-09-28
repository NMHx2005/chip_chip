-- Project Chíp Chíp — channel_name is video-only metadata.
--
-- posts_video_fields_only_on_videos (20260928000100) already fences
-- video_platform, video_external_id, video_source and
-- related_lesson_translation_id to kind = 'video', but it was never extended
-- to channel_name, so a lesson or blog row could carry a channel name that no
-- page ever reads. Additive and nullable, so no backfill is needed — verified
-- against the local stack before writing this migration that no existing row
-- would violate it.

alter table public.posts
  add constraint posts_channel_name_only_on_videos
    check (kind = 'video' or channel_name is null);
