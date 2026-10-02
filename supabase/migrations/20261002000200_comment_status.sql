-- Project Chíp Chíp — a comment is private until a moderator approves it.
--
-- `is_hidden` could only say "shown" or "hidden", so a comment had to be public
-- the moment it was written: spam and abuse stayed up until someone noticed.
-- The replacement is a three-state column — a new comment starts 'pending', and
-- a moderator moves it to 'approved' (public) or 'hidden'.

alter table public.comments
  add column status public.comment_status not null default 'pending';

-- Everything that exists today was public unless it had been hidden, so the
-- migration changes no comment's visibility.
-- The cast is required: CASE over two bare literals resolves to text, which
-- does not assign to an enum column.
update public.comments
   set status = (case when is_hidden then 'hidden' else 'approved' end)::public.comment_status;

create index comments_moderation_idx on public.comments (status, created_at desc);

-- The public policy is the only thing that decides what a reader sees; the
-- staff policy is unchanged and keeps letting staff read every state.
drop policy "comments_select_visible" on public.comments;
create policy "comments_select_visible"
  on public.comments for select
  to anon, authenticated
  using (status = 'approved');

alter table public.comments drop column is_hidden;

-- Dropping `is_hidden` also drops `comments_post_idx (post_id, created_at)
-- where is_hidden = false` from 20260912000000_init.sql — Postgres removes an
-- index whose predicate names a dropped column, and says nothing about it. That
-- is the index listComments and countComments lean on, so it is re-created on
-- the new predicate (after the drop, hence the same name being free again).
create index comments_post_idx on public.comments (post_id, created_at)
  where status = 'approved';

-- 20260913000000_harden_access.sql grants SELECT on an explicit column list so
-- `author_email` stays out of reach. That list names `is_hidden`, and a column
-- grant does not follow a rename — this has to be re-issued or anon ends up
-- with the wrong columns.
revoke select on public.comments from anon, authenticated;
grant select (id, post_id, parent_id, author_name, body, is_post_author, status, created_at)
  on public.comments to anon, authenticated;
