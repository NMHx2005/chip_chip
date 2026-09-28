-- Project Chíp Chíp — videos are a kind of post.
--
-- On its own because Postgres refuses to use an enum value added in the same
-- transaction: every constraint that mentions 'video' lives in the next file.

alter type public.post_kind add value if not exists 'video';
