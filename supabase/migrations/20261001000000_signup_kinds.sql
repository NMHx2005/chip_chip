-- Project Chíp Chíp — sign-up kinds for the shared /dang-ky form.
--
-- The form reuses public.messages (one inbox, one rate limit, no new table);
-- only the four new kinds are added. They are added here and never used in the
-- same migration, so `alter type ... add value` stays safe inside the
-- migration's transaction.

alter type public.message_kind add value if not exists 'volunteer';
alter type public.message_kind add value if not exists 'survey';
alter type public.message_kind add value if not exists 'webinar';
alter type public.message_kind add value if not exists 'competition';
