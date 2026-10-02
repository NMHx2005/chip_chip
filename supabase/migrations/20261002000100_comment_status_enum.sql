-- Project Chíp Chíp — the moderation state of a comment.
--
-- Alone in its own file: Postgres will not let a new enum value be used in the
-- same transaction that created it (see 20260928000000_video_kind.sql and
-- 20261001000000_signup_kinds.sql for the same workaround).

create type public.comment_status as enum ('pending', 'approved', 'hidden');
