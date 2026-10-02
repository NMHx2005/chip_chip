-- Project Chíp Chíp — snapshots of an article before it is overwritten.
--
-- Nothing else keeps version history: `posts` holds only the current state, so
-- a bad save or a mistaken publish could not be undone. The app writes the
-- *previous* row here before each write, and the editor offers the newest
-- snapshots with a restore.

create table public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  title text not null default '',
  slug text not null default '',
  excerpt text,
  cover_image_url text,
  content jsonb not null default '{"type":"doc","content":[]}',
  status public.post_status not null,
  -- Who made the change that replaced this snapshot; null if that account is
  -- later removed (the revision itself is still worth keeping).
  saved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index post_revisions_post_idx on public.post_revisions (post_id, created_at desc);

alter table public.post_revisions enable row level security;

create policy "post_revisions_select_staff"
  on public.post_revisions for select
  to authenticated
  using (public.is_staff());

-- Staff may add history; there is deliberately no update or delete policy, so
-- a snapshot cannot be rewritten or removed from the client.
create policy "post_revisions_insert_staff"
  on public.post_revisions for insert
  to authenticated
  with check (public.is_staff());

/**
 * Keeps the newest `p_keep` snapshots of one post and drops the rest.
 *
 * SECURITY DEFINER because no delete policy exists: without this, history could
 * only ever grow. It checks staff itself, since a definer function runs with
 * the owner's rights.
 */
create or replace function public.prune_post_revisions(
  p_post_id uuid,
  p_keep int default 20
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not staff' using errcode = '42501';
  end if;
  if p_keep < 1 then
    raise exception 'keep must be at least 1' using errcode = '22023';
  end if;

  delete from public.post_revisions r
   where r.post_id = p_post_id
     and r.id not in (
       select id
         from public.post_revisions
        where post_id = p_post_id
        order by created_at desc, id desc
        limit p_keep
     );
end;
$$;

revoke all on function public.prune_post_revisions(uuid, int) from public, anon;
grant execute on function public.prune_post_revisions(uuid, int) to authenticated;

comment on table public.post_revisions is
  'The previous state of an article, written before each save, publish or restore. Pruned to the newest 20 per post.';
