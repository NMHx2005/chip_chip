-- Search-index bookkeeping must not read as an edit.
--
-- `rebuildSearchText()` (src/app/admin/actions.ts) only writes `plain_text`,
-- but the shared `touch_updated_at()` trigger bumps `updated_at` on every
-- update regardless of which columns changed. That made pressing "Cập nhật
-- chỉ mục tìm kiếm" show every article as edited "today" on the public site.
-- `search_vector` is a generated column derived from `plain_text`, so it
-- changes in lockstep and is excluded for the same reason.
create or replace function public.touch_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - array['plain_text', 'search_vector', 'updated_at'])
     = (to_jsonb(old) - array['plain_text', 'search_vector', 'updated_at']) then
    return new;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_posts_updated_at();
