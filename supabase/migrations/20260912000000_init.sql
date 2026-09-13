-- Project Chíp Chíp — initial schema
-- Run with: npx supabase db reset   (local)
--           supabase db push        (hosted)

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type public.post_kind as enum ('lesson', 'forum');
create type public.post_locale as enum ('vi', 'en');
create type public.post_status as enum ('draft', 'published');
create type public.staff_role as enum ('admin', 'editor');

-- ─── Staff profiles ──────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role public.staff_role not null default 'editor',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Project staff. Rows are created automatically by the on_auth_user_created trigger.';

/**
 * Role check that bypasses RLS on profiles.
 *
 * Without SECURITY DEFINER, a policy on `profiles` that selects from `profiles`
 * recurses into itself and Postgres raises "infinite recursion detected".
 */
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- ─── Posts ───────────────────────────────────────────────────────────────────
-- Lessons and forum articles share one table: they use the same editor,
-- renderer, comment system and list components. `topic` only means something
-- when kind = 'lesson'.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null default gen_random_uuid(),
  locale public.post_locale not null,
  kind public.post_kind not null default 'forum',
  topic text,
  title text not null default '',
  slug text not null default '',
  excerpt text,
  cover_image_url text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.post_status not null default 'draft',
  author_id uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint posts_slug_format check (slug = '' or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint posts_topic_only_for_lessons check (topic is null or kind = 'lesson'),
  constraint posts_topic_valid check (
    topic is null or topic in ('dinh-nghia', 'nguyen-ly', 'ung-dung', 'lich-su')
  ),
  constraint posts_published_needs_date check (
    (status = 'published') = (published_at is not null)
  ),
  constraint posts_locale_slug_unique unique (locale, slug)
);

comment on column public.posts.translation_id is
  'Groups the VI and EN rows of the same article. Publishing acts on the group.';

create index posts_translation_idx on public.posts (translation_id);
create index posts_listing_idx
  on public.posts (kind, locale, status, published_at desc);
create index posts_topic_idx
  on public.posts (topic, locale, status, published_at desc)
  where kind = 'lesson';

-- ─── Comments ────────────────────────────────────────────────────────────────

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_name text not null,
  -- Never exposed to clients: no policy and no query selects this column.
  author_email text,
  body text not null,
  is_post_author boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),

  constraint comments_body_length check (char_length(body) between 1 and 2000),
  constraint comments_name_length check (char_length(author_name) between 1 and 80)
);

create index comments_post_idx
  on public.comments (post_id, created_at)
  where is_hidden = false;
create index comments_parent_idx on public.comments (parent_id);

-- ─── Comment rate limiting ───────────────────────────────────────────────────
-- Written only by the /api/comments route handler using the service role.

create table public.comment_rate_limit (
  id bigserial primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index comment_rate_limit_idx
  on public.comment_rate_limit (ip_hash, created_at desc);

-- ─── updated_at ──────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- ─── Profile bootstrap ───────────────────────────────────────────────────────

/**
 * Creates a profile for every new auth user. The very first user becomes an
 * admin so the project can be bootstrapped without touching the dashboard.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_first boolean;
begin
  select not exists (select 1 from public.profiles) into v_is_first;

  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when v_is_first then 'admin'::public.staff_role else 'editor'::public.staff_role end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Publish / unpublish a translation group ─────────────────────────────────

/**
 * Publishes both locales of an article at once.
 *
 * This is what enforces "every post must exist in VI and EN": there is no way
 * to publish one half of a translation on its own, because the gate lives here
 * rather than in the UI.
 */
create or replace function public.publish_translation(p_translation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_ready int;
begin
  if not public.is_staff() then
    raise exception 'Not authorised to publish.' using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (
      where length(btrim(title)) > 0
        and jsonb_array_length(coalesce(content -> 'content', '[]'::jsonb)) > 0
    )
  into v_total, v_ready
  from public.posts
  where translation_id = p_translation_id;

  if v_total < 2 then
    raise exception
      'Cần có đủ bản tiếng Việt và tiếng Anh trước khi đăng (hiện có % bản).',
      v_total
      using errcode = '23514';
  end if;

  if v_ready < v_total then
    raise exception
      'Mỗi bản dịch cần có tiêu đề và nội dung trước khi đăng.'
      using errcode = '23514';
  end if;

  update public.posts
     set status = 'published',
         published_at = coalesce(published_at, now())
   where translation_id = p_translation_id;
end;
$$;

create or replace function public.unpublish_translation(p_translation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised to unpublish.' using errcode = '42501';
  end if;

  update public.posts
     set status = 'draft',
         published_at = null
   where translation_id = p_translation_id;
end;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.comment_rate_limit enable row level security;

-- profiles: a signed-in user may read their own row; staff may read all.
create policy "profiles_select_self_or_staff"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_staff());

-- posts: anyone may read published rows; staff manage everything.
create policy "posts_select_published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

create policy "posts_select_staff"
  on public.posts for select
  to authenticated
  using (public.is_staff());

create policy "posts_insert_staff"
  on public.posts for insert
  to authenticated
  with check (public.is_staff());

create policy "posts_update_staff"
  on public.posts for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "posts_delete_staff"
  on public.posts for delete
  to authenticated
  using (public.is_staff());

-- comments: anyone may read visible ones, only staff may hide or delete.
-- There is deliberately NO insert policy — comments are written by the
-- /api/comments route handler with the service role, which is where validation,
-- rate limiting and the author badge are applied.
create policy "comments_select_visible"
  on public.comments for select
  to anon, authenticated
  using (is_hidden = false);

create policy "comments_select_staff"
  on public.comments for select
  to authenticated
  using (public.is_staff());

create policy "comments_update_staff"
  on public.comments for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "comments_delete_staff"
  on public.comments for delete
  to authenticated
  using (public.is_staff());

-- comment_rate_limit: no policies at all. Service role bypasses RLS, and the
-- absence of policies keeps every other role out.

-- ─── Storage ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'post-images');

create policy "post_images_staff_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images' and public.is_staff());

create policy "post_images_staff_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-images' and public.is_staff());

create policy "post_images_staff_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and public.is_staff());
