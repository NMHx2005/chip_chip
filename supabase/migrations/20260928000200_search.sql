-- Project Chíp Chíp — accent-insensitive search.
--
-- Students type "ban dan" far more often than "bán dẫn". Both the stored
-- vector and the query go through the same unaccent step, so either spelling
-- finds the other. Postgres ships no Vietnamese dictionary; 'simple' splits on
-- word boundaries and lowercases, which is what a syllable language needs.

create extension if not exists unaccent with schema extensions;

/**
 * unaccent() is only STABLE (its dictionary could change), so it cannot back
 * a generated column. Naming the dictionary explicitly is what makes this
 * wrapper safe to declare IMMUTABLE. The default rules also map đ/Đ to d/D.
 */
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1);
$$;

alter table public.posts
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, public.f_unaccent(coalesce(title, ''))), 'A')
    || setweight(to_tsvector('simple'::regconfig, public.f_unaccent(coalesce(excerpt, ''))), 'B')
    || setweight(to_tsvector('simple'::regconfig, public.f_unaccent(coalesce(plain_text, ''))), 'C')
  ) stored;

create index posts_search_idx on public.posts using gin (search_vector);

/**
 * Ranked search over published posts in one locale.
 *
 * SECURITY INVOKER: it runs under the caller's RLS, so anon sees exactly what
 * a plain select would show. The status filter below is a second fence.
 *
 * The query is split on anything that is not a letter or digit, so no
 * tsquery operator can survive into to_tsquery — there is nothing to escape.
 * Every token is prefix-matched so a half-typed word still finds results;
 * one-letter tokens are dropped unless they are the whole query, since "a:*"
 * matches nearly everything.
 */
create or replace function public.search_posts(
  p_query text,
  p_locale public.post_locale,
  p_kinds public.post_kind[] default array['lesson', 'forum', 'video']::public.post_kind[],
  p_limit int default 20
)
returns table (
  id uuid,
  kind public.post_kind,
  topic text,
  title text,
  slug text,
  excerpt text,
  cover_image_url text,
  difficulty public.post_difficulty,
  published_at timestamptz,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with tokens as (
    select token
      from regexp_split_to_table(
             lower(public.f_unaccent(left(coalesce(p_query, ''), 100))),
             '[^[:alnum:]]+'
           ) as token
     where token <> ''
  ),
  kept as (
    select token
      from tokens
     where char_length(token) > 1
        or (select count(*) from tokens) = 1
  ),
  q as (
    select to_tsquery('simple', string_agg(token || ':*', ' & ')) as query
      from kept
    having count(*) > 0
  )
  select p.id, p.kind, p.topic, p.title, p.slug, p.excerpt, p.cover_image_url,
         p.difficulty, p.published_at,
         ts_rank(p.search_vector, q.query) as rank
    from public.posts p
   cross join q
   where p.status = 'published'
     and p.locale = p_locale
     and p.kind = any (p_kinds)
     and p.search_vector @@ q.query
   order by rank desc, p.published_at desc
   limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

grant execute on function public.search_posts(text, public.post_locale, public.post_kind[], int)
  to anon, authenticated;
