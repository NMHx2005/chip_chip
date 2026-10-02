-- Project Chíp Chíp — admin post list: one row per translation group, paged.
--
-- The admin list shows one entry per article, and an article is two rows (VI
-- and EN) sharing a translation_id. Paging over raw rows would split a group
-- across two pages, and PostgREST cannot group, so the grouping lives here.
--
-- SECURITY INVOKER, plus an explicit is_staff() fence on every function: they
-- are callable by any authenticated user, and drafts must never leak.

/**
 * Whether a row matches the admin list's search box.
 *
 * Substring rather than LIKE, so a typed "%" or "_" stays a literal. Accents are
 * stripped on both sides — the same f_unaccent() the public search uses — so
 * "ban dan" finds "bán dẫn". Shared by the two functions below so the rows and
 * the count can never disagree about what matches.
 */
create or replace function public.admin_post_matches(
  p_title text,
  p_slug text,
  p_search text
)
returns boolean
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select strpos(
    lower(public.f_unaccent(coalesce(p_title, '') || ' ' || coalesce(p_slug, ''))),
    lower(public.f_unaccent(p_search))
  ) > 0;
$$;

/**
 * One page of translation groups, newest first.
 *
 * `ready` mirrors the gate in publish_translation(): every row of the group has
 * a title and a body, and both locales are present. "Every row" rather than
 * "one row per locale" matters because nothing stops a group from holding a
 * third, empty row — such a group must not look publishable, since publish
 * would refuse it.
 */
create or replace function public.admin_post_groups(
  p_search text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  translation_id uuid,
  post_id uuid,
  kind public.post_kind,
  topic text,
  title text,
  status public.post_status,
  updated_at timestamptz,
  vi_title text,
  en_title text,
  ready boolean
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  -- An empty search box means "no filter", not "match nothing".
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_staff() then
    raise exception 'not staff' using errcode = '42501';
  end if;

  return query
  with rows as (
    select
      p.translation_id,
      p.id,
      p.locale,
      p.kind,
      p.topic,
      p.title,
      p.status,
      p.updated_at,
      (
        nullif(btrim(p.title), '') is not null
        and jsonb_typeof(coalesce(p.content -> 'content', '[]'::jsonb)) = 'array'
        and jsonb_array_length(coalesce(p.content -> 'content', '[]'::jsonb)) > 0
      ) as has_body,
      public.admin_post_matches(p.title, p.slug, v_search) as matches
    from public.posts p
  ),
  grouped as (
    select
      r.translation_id,
      -- The VI row is the one shown; a group with only EN still appears.
      (array_agg(r.id order by (r.locale = 'vi') desc))[1] as post_id,
      (array_agg(r.kind order by (r.locale = 'vi') desc))[1] as kind,
      (array_agg(r.topic order by (r.locale = 'vi') desc))[1] as topic,
      (array_agg(r.title order by (r.locale = 'vi') desc))[1] as title,
      (array_agg(r.status order by (r.locale = 'vi') desc))[1] as status,
      max(r.updated_at) as updated_at,
      max(case when r.locale = 'vi' then nullif(btrim(r.title), '') end) as vi_title,
      max(case when r.locale = 'en' then nullif(btrim(r.title), '') end) as en_title,
      count(*) filter (where r.has_body) = count(*)
        and count(*) filter (where r.locale = 'vi') > 0
        and count(*) filter (where r.locale = 'en') > 0 as ready
    from rows r
    group by r.translation_id
    having v_search is null or bool_or(r.matches)
  )
  select
    g.translation_id, g.post_id, g.kind, g.topic, g.title, g.status,
    g.updated_at, g.vi_title, g.en_title, g.ready
  from grouped g
  order by g.updated_at desc, g.translation_id
  limit v_limit
  offset v_offset;
end;
$$;

/**
 * How many groups the same search matches.
 *
 * Kept apart from the rows because a page past the end returns no rows at all —
 * and then the page would have no way to know the list's true size, or where
 * the last page is.
 */
create or replace function public.admin_post_group_count(p_search text default null)
returns bigint
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_total bigint;
begin
  if not public.is_staff() then
    raise exception 'not staff' using errcode = '42501';
  end if;

  select count(*) into v_total
  from (
    select r.translation_id
    from public.posts r
    group by r.translation_id
    having v_search is null
        or bool_or(public.admin_post_matches(r.title, r.slug, v_search))
  ) groups;

  return v_total;
end;
$$;

-- Functions are executable by PUBLIC by default; these are for staff only.
revoke all on function public.admin_post_matches(text, text, text) from public, anon;
grant execute on function public.admin_post_matches(text, text, text) to authenticated;
revoke all on function public.admin_post_groups(text, int, int) from public, anon;
grant execute on function public.admin_post_groups(text, int, int) to authenticated;
revoke all on function public.admin_post_group_count(text) from public, anon;
grant execute on function public.admin_post_group_count(text) to authenticated;

comment on function public.admin_post_groups(text, int, int) is
  'One row per translation group for the admin list, with search, paging and the publish-ready flag. Raises 42501 for non-staff.';
comment on function public.admin_post_group_count(text) is
  'How many translation groups the admin list search matches. Raises 42501 for non-staff.';
