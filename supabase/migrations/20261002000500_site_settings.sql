-- Project Chíp Chíp — the handful of values the maintainer edits without a deploy.
--
-- Only what is genuinely a setting lives here: the contact address, the social
-- links, the reply-time note and the privacy date. Everything else stays in
-- code (`src/lib/constants.ts`) — a settings table is not a place to move the
-- whole site into.
--
-- Values are jsonb and per key, because their shapes differ: a string (email),
-- a list (social links), a per-locale pair (the reply note).

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  -- Kept for the record; the value survives the account.
  updated_by uuid references public.profiles (id) on delete set null,

  constraint site_settings_key_length check (char_length(key) between 1 and 60)
);

alter table public.site_settings enable row level security;

-- Public pages read these (the footer, the contact page), so anonymous visitors
-- must be able to select. Writing is staff-only, and only through the admin
-- screen — there is no delete policy, because clearing a value means setting it
-- to something empty, not removing the row.
create policy "site_settings_select_all"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "site_settings_insert_staff"
  on public.site_settings for insert
  to authenticated
  with check (public.is_staff());

create policy "site_settings_update_staff"
  on public.site_settings for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

comment on table public.site_settings is
  'Key/value settings the admin edits: contact_email, social_links, response_time, privacy_updated. Missing or malformed values fall back to the code defaults.';
