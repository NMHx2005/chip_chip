-- Project Chíp Chíp — admin post list: one row per translation group, paged.
--
-- The admin list shows one entry per article, and an article is two rows (VI
-- and EN) sharing a translation_id. Paging over raw rows would split a group
-- across two pages, and PostgREST cannot group, so the grouping lives here.
--
-- SECURITY INVOKER, plus an explicit is_staff() fence: the function is callable
-- by any authenticated user, and drafts must never leak through it.

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
  ready boolean,
  total bigint
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
      -- Substring, not LIKE: a search box must not turn "%" into a wildcard.
      strpos(
        lower(public.f_unaccent(coalesce(p.title, '') || ' ' || coalesce(p.slug, ''))),
        lower(public.f_unaccent(v_search))
      ) > 0 as matches
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
      -- Mirrors isTranslationGroupReady() in src/lib/shared-fields.ts.
      bool_or(r.locale = 'vi' and r.has_body) and bool_or(r.locale = 'en' and r.has_body) as ready
    from rows r
    group by r.translation_id
    having v_search is null or bool_or(r.matches)
  )
  select
    g.translation_id, g.post_id, g.kind, g.topic, g.title, g.status,
    g.updated_at, g.vi_title, g.en_title, g.ready,
    count(*) over () as total
  from grouped g
  order by g.updated_at desc, g.translation_id
  limit v_limit
  offset v_offset;
end;
$$;

-- Functions are executable by PUBLIC by default; this one is for staff only.
revoke all on function public.admin_post_groups(text, int, int) from public, anon;
grant execute on function public.admin_post_groups(text, int, int) to authenticated;

comment on function public.admin_post_groups(text, int, int) is
  'One row per translation group for the admin list, with search, paging and the publish-ready flag. Raises 42501 for non-staff.';
