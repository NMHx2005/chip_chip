-- Project Chíp Chíp — is an image still referenced by an article?
--
-- The media library refuses to delete an image an article points at, and doing
-- that check in the app was wrong twice over:
--
--   * PostgREST caps a response at `max_rows` (1000 here), so a table larger
--     than that would silently answer "not in use" for anything past the cut.
--   * The app compared the *whole* public URL. Store a cover while pointing at
--     a different Supabase project — local `127.0.0.1:54321` versus the
--     deployed `https://<ref>.supabase.co` — and the same image no longer
--     matches its own row.
--
-- Matching on the object path instead of the URL makes it host-agnostic, and
-- `position()` (not LIKE) means a `_` in a filename cannot act as a wildcard.

create or replace function public.admin_media_in_use(p_path text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not staff' using errcode = '42501';
  end if;

  -- The stored value is a URL ending in `/post-images/<path>`; the leading
  -- slash keeps `a/b.png` from matching `xa/b.png`.
  return exists (
    select 1
      from public.posts p
     where position('/' || p_path in coalesce(p.cover_image_url, '')) > 0
        or position('/' || p_path in p.content::text) > 0
  );
end;
$$;

-- Functions are executable by PUBLIC by default; this one is for staff only.
revoke all on function public.admin_media_in_use(text) from public, anon;
grant execute on function public.admin_media_in_use(text) to authenticated;

comment on function public.admin_media_in_use(text) is
  'Whether any article still references this media path (cover or body). Raises 42501 for non-staff.';
