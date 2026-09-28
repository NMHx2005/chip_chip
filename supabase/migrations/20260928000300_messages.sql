-- Project Chíp Chíp — contact, feedback and "this lesson has a mistake" inbox.
--
-- Same shape as comments: there is deliberately NO insert policy. Messages are
-- written only by /api/messages with the service role, which is where the
-- honeypot, validation and rate limit run.

create type public.message_kind as enum ('contact', 'feedback', 'content_error');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  kind public.message_kind not null,
  name text not null,
  email text,
  body text not null,
  -- Set when a reader reports a mistake from inside an article.
  post_id uuid references public.posts (id) on delete set null,
  locale public.post_locale not null,
  is_handled boolean not null default false,
  created_at timestamptz not null default now(),

  constraint messages_name_length check (char_length(name) between 1 and 80),
  constraint messages_email_length check (email is null or char_length(email) <= 254),
  constraint messages_body_length check (char_length(body) between 1 and 4000)
);

create index messages_inbox_idx on public.messages (is_handled, created_at desc);

alter table public.messages enable row level security;

create policy "messages_select_staff"
  on public.messages for select
  to authenticated
  using (public.is_staff());

create policy "messages_update_staff"
  on public.messages for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "messages_delete_staff"
  on public.messages for delete
  to authenticated
  using (public.is_staff());
