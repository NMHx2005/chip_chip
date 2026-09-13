-- Project Chíp Chíp — access hardening
--
-- The initial schema had three holes that a review found and reproduced
-- against a local stack. This migration closes them. It is additive and does
-- not edit 20260912000000_init.sql, so it applies cleanly to a database that
-- already ran the initial migration.
--
--   1. Having an auth account meant being staff. Anyone could self-register
--      with the public anon key and publish articles.
--   2. RLS filters rows, not columns — `comments.author_email` was readable
--      by anyone holding the anon key.
--   3. The comment rate limit counted and inserted in two round trips, so
--      concurrent requests slipped past it.

-- ─── 1. Staff must be activated explicitly ───────────────────────────────────

alter table public.profiles
  add column if not exists is_active boolean not null default false;

comment on column public.profiles.is_active is
  'Gate for staff access. A fresh signup is inactive; an existing admin '
  'activates the account. `is_staff()` requires it.';

-- Everyone who already had a profile was created by hand before this gate
-- existed, so they are real staff.
update public.profiles set is_active = true where is_active = false;

/**
 * Role check that bypasses RLS on profiles.
 *
 * Now requires `is_active`: an auth account on its own is no longer proof of
 * staff membership. Every posts/comments/storage policy reads through here, so
 * this one predicate is what keeps the CMS closed.
 */
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and is_active
  );
$$;

/**
 * Creates a profile for every new auth user — inactive, with no privileges.
 *
 * The previous version made the first user an admin automatically. With open
 * signup that was a race: whoever registered first won the project. Bootstrap
 * is now a deliberate step, documented in README.md:
 *
 *   update public.profiles set role = 'admin', is_active = true
 *    where id = (select id from auth.users where email = 'you@example.com');
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'editor'::public.staff_role,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ─── 2. author_email is not a public column ──────────────────────────────────
-- A column-level REVOKE does nothing while a table-level SELECT grant stands,
-- so the table grant is dropped and replaced with an explicit column list.
-- Staff read this column through the service role in the admin area, never
-- through PostgREST.

revoke select on public.comments from anon, authenticated;

grant select (
  id, post_id, parent_id, author_name, body,
  is_post_author, is_hidden, created_at
) on public.comments to anon, authenticated;

-- ─── 3. Atomic rate limiting ─────────────────────────────────────────────────

alter table public.comment_rate_limit
  add column if not exists scope text not null default 'comment';

drop index if exists public.comment_rate_limit_idx;
create index comment_rate_limit_idx
  on public.comment_rate_limit (scope, ip_hash, created_at desc);

/**
 * Counts and records one request in a single transaction.
 *
 * The advisory lock is what makes it safe: without it two concurrent requests
 * both read a count below the limit and both insert. Old rows are pruned here
 * rather than by a scheduled job, so the table cannot grow without bound.
 *
 * Returns false when the caller is over the limit.
 */
create or replace function public.consume_rate_limit(
  p_scope text,
  p_key text,
  p_limit int,
  p_window_minutes int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_scope || ':' || p_key));

  delete from public.comment_rate_limit
   where created_at < now() - interval '1 day';

  select count(*) into v_count
    from public.comment_rate_limit
   where scope = p_scope
     and ip_hash = p_key
     and created_at > now() - make_interval(mins => p_window_minutes);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.comment_rate_limit (scope, ip_hash) values (p_scope, p_key);
  return true;
end;
$$;

-- Only the service role may spend quota — otherwise a client could drain
-- someone else's allowance, or skip its own.
revoke execute on function public.consume_rate_limit(text, text, int, int)
  from anon, authenticated, public;
