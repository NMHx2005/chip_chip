-- Project Chíp Chíp — difficulty levels and video metadata.
--
-- Everything here is additive and nullable, so rows written before this
-- migration stay valid. The publish gate is what makes the new fields
-- mandatory, and only at the moment of publishing.

create type public.post_difficulty as enum ('basic', 'intermediate', 'advanced');
create type public.video_platform as enum ('youtube', 'tiktok');
create type public.video_source as enum ('own', 'curated');

alter table public.posts
  add column difficulty public.post_difficulty,
  add column video_platform public.video_platform,
  -- Only the platform's own id is stored, never a URL: the embed URL is built
  -- by the app from (platform, id), so no row can make a page frame an
  -- arbitrary address.
  add column video_external_id text,
  add column video_source public.video_source,
  add column channel_name text,
  -- Points at a lesson's translation group. No foreign key is possible because
  -- translation_id is shared by two rows; readers join on published lessons
  -- only, so a link to a deleted lesson disappears instead of breaking.
  add column related_lesson_translation_id uuid,
  -- Written by the app on save (see savePost), read by the search index.
  add column plain_text text;

alter table public.posts drop constraint posts_topic_only_for_lessons;

alter table public.posts
  add constraint posts_topic_for_lessons_and_videos
    check (topic is null or kind in ('lesson', 'video')),
  add constraint posts_difficulty_not_on_forum
    check (kind <> 'forum' or difficulty is null),
  add constraint posts_video_fields_only_on_videos check (
    kind = 'video' or (
      video_platform is null
      and video_external_id is null
      and video_source is null
      and related_lesson_translation_id is null
    )
  ),
  add constraint posts_video_ref_pair
    check ((video_platform is null) = (video_external_id is null)),
  add constraint posts_video_external_id_format check (
    video_external_id is null
    or (video_platform = 'youtube' and video_external_id ~ '^[A-Za-z0-9_-]{11}$')
    or (video_platform = 'tiktok' and video_external_id ~ '^[0-9]{8,25}$')
  ),
  add constraint posts_channel_name_length
    check (channel_name is null or char_length(channel_name) <= 120);

create index posts_video_lesson_idx
  on public.posts (related_lesson_translation_id)
  where kind = 'video';

create index posts_difficulty_idx
  on public.posts (kind, locale, status, difficulty)
  where difficulty is not null;

/**
 * Publishes both locales of an article at once.
 *
 * On top of the original gate (both locales present, each with a title and a
 * body), the fields a translation group shares must agree across its rows —
 * otherwise the VI page could call a lesson "basic" while the EN page says
 * "advanced". `detail` carries a stable code the app and the security script
 * can match without parsing the Vietnamese message.
 */
create or replace function public.publish_translation(p_translation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_ready int;
  v_shapes int;
  v_kind public.post_kind;
  v_difficulty public.post_difficulty;
  v_platform public.video_platform;
  v_source public.video_source;
begin
  if not public.is_staff() then
    raise exception 'Not authorised to publish.' using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (
      where length(btrim(title)) > 0
        and jsonb_array_length(coalesce(content -> 'content', '[]'::jsonb)) > 0
    ),
    -- jsonb keeps NULL and '' apart, which a row-to-text cast would not.
    count(distinct jsonb_build_array(
      kind, topic, difficulty, video_platform, video_external_id,
      video_source, channel_name, related_lesson_translation_id
    ))
  into v_total, v_ready, v_shapes
  from public.posts
  where translation_id = p_translation_id;

  if v_total < 2 then
    raise exception
      'Cần có đủ bản tiếng Việt và tiếng Anh trước khi đăng (hiện có % bản).',
      v_total
      using errcode = '23514', detail = 'translation_incomplete';
  end if;

  if v_ready < v_total then
    raise exception
      'Mỗi bản dịch cần có tiêu đề và nội dung trước khi đăng.'
      using errcode = '23514', detail = 'translation_empty';
  end if;

  if v_shapes > 1 then
    raise exception
      'Bản Việt và bản Anh đang lệch nhau ở chủ đề, độ khó hoặc thông tin video. Lưu lại bài rồi đăng lại.'
      using errcode = '23514', detail = 'translation_mismatch';
  end if;

  select kind, difficulty, video_platform, video_source
    into v_kind, v_difficulty, v_platform, v_source
    from public.posts
   where translation_id = p_translation_id
   limit 1;

  if v_kind in ('lesson', 'video') and v_difficulty is null then
    raise exception
      'Bài học và video cần chọn độ khó trước khi đăng.'
      using errcode = '23514', detail = 'difficulty_required';
  end if;

  if v_kind = 'video' and (v_platform is null or v_source is null) then
    raise exception
      'Video cần có đường dẫn YouTube/TikTok và nguồn (tự làm hay tuyển chọn) trước khi đăng.'
      using errcode = '23514', detail = 'video_incomplete';
  end if;

  update public.posts
     set status = 'published',
         published_at = coalesce(published_at, now())
   where translation_id = p_translation_id;
end;
$$;
