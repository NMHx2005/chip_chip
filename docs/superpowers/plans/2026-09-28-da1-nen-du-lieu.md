# DA1 — Nền dữ liệu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng tầng dữ liệu cho video, độ khó, tìm kiếm không dấu và hộp thư liên hệ; đổi Diễn đàn thành Blog.

**Architecture:** Video là `kind = 'video'` trong bảng `posts` (không bảng riêng), nên kế thừa cổng song ngữ `publish_translation`, RLS và CMS sẵn có. Tìm kiếm là cột `tsvector` generated + hàm `search_posts` `security invoker`. Tin nhắn đi qua route handler bằng service role, cùng khuôn với `/api/comments`.

**Tech Stack:** Next.js 14 App Router · Supabase (Postgres 15, PostgREST) · next-intl · Vitest 2.

**Spec:** `docs/superpowers/specs/2026-09-28-da1-nen-du-lieu-design.md` (lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md`)

## Global Constraints

- Không sửa `supabase/migrations/20260912000000_init.sql` và `20260913000000_harden_access.sql`; chỉ thêm file mới.
- Không chạy migration lên production trong plan này. Mọi kiểm tra DB chạy trên stack local (`npx supabase start`).
- Server Action trả `ActionResult`, không `redirect()`; bắt đầu bằng `const lookup = await lookUpStaff(); if (lookup.status !== "ok") return SESSION_ENDED;`.
- Enum nội bộ giữ `'forum'`; thư mục `components/forum/` giữ nguyên tên. Chỉ URL và chữ hiển thị đổi thành Blog.
- Mọi chuỗi giao diện công khai qua `messages/{vi,en}.json`; hai file có cùng tập khoá. Admin viết tiếng Việt thẳng trong JSX (theo lệ sẵn có).
- Code, comment, tên biến, **commit message**: tiếng Anh (quy tắc toàn cục của chủ dự án). Comment chỉ giải thích *vì sao*.
- Không thêm dependency mới.
- Redirect URL cũ dùng mã **301** (`statusCode: 301`, không dùng `permanent: true` vì Next trả 308).
- Giới hạn: tên 1–80, email ≤ 254, nội dung tin nhắn 1–4000, `channel_name` ≤ 120, câu tìm kiếm cắt ở 100 ký tự, `p_limit` kẹp `[1, 50]`, rate limit tin nhắn 3 / 60 phút scope `'message'`.
- Lệnh kiểm cục bộ: `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=3`, `npm run build`.

## Lệch so với spec (đã cân nhắc, cần chủ dự án biết)

1. **Backfill `plain_text` là nút trong trang admin, không phải script.** `articleToPlainText` nằm trong module `server-only` và repo không có `tsx`, nên một script Node chạy TypeScript phải thêm dependency. Server Action `rebuildSearchText()` dùng đúng hàm của `savePost`, chạy dưới quyền staff.
2. **Tìm kiếm và `messages` tách thành hai file migration** (`…000200_search.sql`, `…000300_messages.sql`) để mỗi task một file.
3. **Test "số khoá vi = en" chưa từng tồn tại** dù spec coi là có sẵn — Task 4 thêm nó.
4. **Chọn độ khó đưa luôn vào form "Viết bài mới"** (Task 9). Không có nó, từ lúc DA1 xong tới lúc DA2 xong sẽ không đăng được bài học mới nào, vì cổng đăng bài giờ đòi độ khó.

## Review Focus

1. Câu tìm kiếm chỉ gồm ký tự cú pháp tsquery hoặc emoji (`&|!():*'"🙂`) → trả mảng rỗng với HTTP 200, không lỗi 500 hay lỗi cú pháp tsquery. *(Task 2, kiểm tra S4)*
2. Câu tìm kiếm rất dài (10 000 ký tự) → bị cắt, vẫn trả 200. *(Task 2, kiểm tra S5)*
3. Payload tin nhắn với kiểu sai (mảng, object, số, `null`) ở `name`/`body`/`kind` → 400 có mã lỗi, không ném 500. *(Task 8, test `rejects non-string fields`)*
4. `saveSharedFields` với `translationId` không tồn tại hoặc không phải uuid → trả lỗi rõ, không `ok: true` câm. *(Task 7, test `rejects a malformed translation id` + bước kiểm tay)*
5. URL cũ có query string (`/vi/dien-dan?page=2`) → redirect giữ nguyên query. *(Task 10, kiểm bằng trình duyệt)*

---

## File map

| File | Trách nhiệm |
|---|---|
| `supabase/migrations/20260928000000_video_kind.sql` | Thêm giá trị enum `video` (phải đứng riêng) |
| `supabase/migrations/20260928000100_video_difficulty.sql` | Enum + cột mới, constraint, `publish_translation` mới |
| `supabase/migrations/20260928000200_search.sql` | `unaccent`, `f_unaccent`, `search_vector`, `search_posts` |
| `supabase/migrations/20260928000300_messages.sql` | Bảng `messages` + RLS |
| `scripts/verify-security.sh` | Thêm các kiểm tra khai thác thật cho DA1 |
| `src/lib/legacy-redirects.mjs` (+ `.test.ts`) | Bảng redirect 301 dùng chung cho `next.config.mjs` và test |
| `src/messages/keys-parity.test.ts` | vi.json và en.json cùng tập khoá |
| `src/lib/video.ts` (+ `.test.ts`) | `parseVideoUrl`, `embedUrl` — thuần, dùng được ở client |
| `src/lib/shared-fields.ts` (+ `.test.ts`) | Dựng patch trường dùng chung của nhóm dịch — thuần |
| `src/lib/contact-message.ts` (+ `.test.ts`) | `parseMessagePayload` — thuần |
| `src/app/api/messages/route.ts` | Nhận tin nhắn |
| `src/app/admin/(dashboard)/tin-nhan/page.tsx` | Hộp thư admin |
| `src/components/admin/MessageActions.tsx` | Nút đánh dấu / xoá tin |
| `src/components/admin/RebuildSearchButton.tsx` | Nút dựng lại chữ tìm kiếm |

---

### Task 1: Migration video và độ khó

**Files:**
- Create: `supabase/migrations/20260928000000_video_kind.sql`
- Create: `supabase/migrations/20260928000100_video_difficulty.sql`
- Modify: `scripts/verify-security.sh`

**Interfaces:**
- Produces (DB): enum `post_kind` có `'video'`; enum `post_difficulty ('basic','intermediate','advanced')`, `video_platform ('youtube','tiktok')`, `video_source ('own','curated')`; cột `posts.difficulty, video_platform, video_external_id, video_source, channel_name, related_lesson_translation_id, plain_text`; `publish_translation` ném `errcode 23514` với `detail` là `translation_mismatch` | `difficulty_required` | `video_incomplete`.

- [ ] **Step 1: Khởi động stack local và xác nhận điểm xuất phát xanh**

Run: `npx supabase start && npx supabase db reset && ./scripts/verify-security.sh`
Expected: `Tất cả kiểm tra đều đạt.`

- [ ] **Step 2: Viết kiểm tra thất bại trong `verify-security.sh`**

Thêm vào `cleanup()` (trước dòng `delete from auth.users`):

```bash
  psql "$DB_URL" -q -c "delete from public.posts where slug like 'sec-%-$$%';" >/dev/null 2>&1 || true
```

Thêm helper ngay sau hàm `denied()`:

```bash
# Runs SQL as the superuser and reports whether Postgres accepted it. Used for
# CHECK constraints, which no API role could exercise more directly.
sql_outcome() {
  if psql "$DB_URL" -q -v ON_ERROR_STOP=1 -c "$1" >/dev/null 2>&1; then
    echo "allowed"
  else
    echo "blocked"
  fi
}
```

Thêm trước khối `echo; if [ "$failures" -eq 0 ]` cuối file:

```bash
echo
echo "D1 — dữ liệu video phải hợp lệ"
check "không lưu được ID video dạng javascript:" "blocked" "$(sql_outcome \
  "insert into public.posts (locale, kind, slug, video_platform, video_external_id)
   values ('vi', 'video', 'sec-vid-$$', 'youtube', 'javascript:alert(1)');")"
check "không gắn trường video vào bài blog" "blocked" "$(sql_outcome \
  "insert into public.posts (locale, kind, slug, video_platform, video_external_id)
   values ('vi', 'forum', 'sec-vidf-$$', 'youtube', 'dQw4w9WgXcQ');")"
check "không gắn độ khó vào bài blog" "blocked" "$(sql_outcome \
  "insert into public.posts (locale, kind, slug, difficulty)
   values ('vi', 'forum', 'sec-diff-$$', 'basic');")"

echo
echo "D2 — cổng đăng bài của nhóm dịch"
# Publishing needs an activated staff member; the throwaway account is promoted
# only here, after every check that needs it to be an outsider has run.
psql "$DB_URL" -q -c "update public.profiles set is_active = true
  where id = (select id from auth.users where email = '$EMAIL');"

doc='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x"}]}]}'
publish_detail() {
  curl -s -X POST "$API_URL/rest/v1/rpc/publish_translation" "${auth[@]}" \
    -H 'Content-Type: application/json' -d "{\"p_translation_id\":\"$1\"}" |
    sed -n 's/.*"details":"\([^"]*\)".*/\1/p'
}

mis=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, topic, difficulty, title, slug, content) values
  ('$mis', 'vi', 'lesson', 'nguyen-ly', 'basic',    'x', 'sec-mis-$$-vi', '$doc'),
  ('$mis', 'en', 'lesson', 'nguyen-ly', 'advanced', 'x', 'sec-mis-$$-en', '$doc');"
check "hai bản lệch độ khó thì không đăng được" "translation_mismatch" "$(publish_detail "$mis")"

nod=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, topic, title, slug, content) values
  ('$nod', 'vi', 'lesson', 'nguyen-ly', 'x', 'sec-nod-$$-vi', '$doc'),
  ('$nod', 'en', 'lesson', 'nguyen-ly', 'x', 'sec-nod-$$-en', '$doc');"
check "bài học thiếu độ khó thì không đăng được" "difficulty_required" "$(publish_detail "$nod")"

vid=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, difficulty, title, slug, content) values
  ('$vid', 'vi', 'video', 'basic', 'x', 'sec-vid-$$-vi', '$doc'),
  ('$vid', 'en', 'video', 'basic', 'x', 'sec-vid-$$-en', '$doc');"
check "video thiếu đường dẫn thì không đăng được" "video_incomplete" "$(publish_detail "$vid")"
```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `./scripts/verify-security.sh`
Expected: các dòng D1/D2 `FAIL` (cột và giá trị `'video'` chưa tồn tại, `publish_translation` chưa có `detail`), script thoát mã 1.

- [ ] **Step 4: Viết `20260928000000_video_kind.sql`**

```sql
-- Project Chíp Chíp — videos are a kind of post.
--
-- On its own because Postgres refuses to use an enum value added in the same
-- transaction: every constraint that mentions 'video' lives in the next file.

alter type public.post_kind add value if not exists 'video';
```

- [ ] **Step 5: Viết `20260928000100_video_difficulty.sql`**

```sql
-- Project Chíp Chíp — difficulty levels and video metadata.
--
-- Everything here is additive and nullable, so rows written before this
-- migration stay valid. The publish gate is what makes the new fields
-- mandatory, and only at the moment of publishing.

create type public.post_difficulty as enum ('basic', 'intermediate', 'advanced');
create type public.video_platform as enum ('youtube', 'tiktok');
create type public.video_source as enum ('own', 'curated');

alter table public.posts
  add column difficulty public.post_difficulty,
  add column video_platform public.video_platform,
  -- Only the platform's own id is stored, never a URL: the embed URL is built
  -- by the app from (platform, id), so no row can make a page frame an
  -- arbitrary address.
  add column video_external_id text,
  add column video_source public.video_source,
  add column channel_name text,
  -- Points at a lesson's translation group. No foreign key is possible because
  -- translation_id is shared by two rows; readers join on published lessons
  -- only, so a link to a deleted lesson disappears instead of breaking.
  add column related_lesson_translation_id uuid,
  -- Written by the app on save (see savePost), read by the search index.
  add column plain_text text;

alter table public.posts drop constraint posts_topic_only_for_lessons;

alter table public.posts
  add constraint posts_topic_for_lessons_and_videos
    check (topic is null or kind in ('lesson', 'video')),
  add constraint posts_difficulty_not_on_forum
    check (kind <> 'forum' or difficulty is null),
  add constraint posts_video_fields_only_on_videos check (
    kind = 'video' or (
      video_platform is null
      and video_external_id is null
      and video_source is null
      and related_lesson_translation_id is null
    )
  ),
  add constraint posts_video_ref_pair
    check ((video_platform is null) = (video_external_id is null)),
  add constraint posts_video_external_id_format check (
    video_external_id is null
    or (video_platform = 'youtube' and video_external_id ~ '^[A-Za-z0-9_-]{11}$')
    or (video_platform = 'tiktok' and video_external_id ~ '^[0-9]{8,25}$')
  ),
  add constraint posts_channel_name_length
    check (channel_name is null or char_length(channel_name) <= 120);

create index posts_video_lesson_idx
  on public.posts (related_lesson_translation_id)
  where kind = 'video';

create index posts_difficulty_idx
  on public.posts (kind, locale, status, difficulty)
  where difficulty is not null;

/**
 * Publishes both locales of an article at once.
 *
 * On top of the original gate (both locales present, each with a title and a
 * body), the fields a translation group shares must agree across its rows —
 * otherwise the VI page could call a lesson "basic" while the EN page says
 * "advanced". `detail` carries a stable code the app and the security script
 * can match without parsing the Vietnamese message.
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
  v_shapes int;
  v_kind public.post_kind;
  v_difficulty public.post_difficulty;
  v_platform public.video_platform;
  v_source public.video_source;
begin
  if not public.is_staff() then
    raise exception 'Not authorised to publish.' using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (
      where length(btrim(title)) > 0
        and jsonb_array_length(coalesce(content -> 'content', '[]'::jsonb)) > 0
    ),
    -- jsonb keeps NULL and '' apart, which a row-to-text cast would not.
    count(distinct jsonb_build_array(
      kind, topic, difficulty, video_platform, video_external_id,
      video_source, channel_name, related_lesson_translation_id
    ))
  into v_total, v_ready, v_shapes
  from public.posts
  where translation_id = p_translation_id;

  if v_total < 2 then
    raise exception
      'Cần có đủ bản tiếng Việt và tiếng Anh trước khi đăng (hiện có % bản).',
      v_total
      using errcode = '23514', detail = 'translation_incomplete';
  end if;

  if v_ready < v_total then
    raise exception
      'Mỗi bản dịch cần có tiêu đề và nội dung trước khi đăng.'
      using errcode = '23514', detail = 'translation_empty';
  end if;

  if v_shapes > 1 then
    raise exception
      'Bản Việt và bản Anh đang lệch nhau ở chủ đề, độ khó hoặc thông tin video. Lưu lại bài rồi đăng lại.'
      using errcode = '23514', detail = 'translation_mismatch';
  end if;

  select kind, difficulty, video_platform, video_source
    into v_kind, v_difficulty, v_platform, v_source
    from public.posts
   where translation_id = p_translation_id
   limit 1;

  if v_kind in ('lesson', 'video') and v_difficulty is null then
    raise exception
      'Bài học và video cần chọn độ khó trước khi đăng.'
      using errcode = '23514', detail = 'difficulty_required';
  end if;

  if v_kind = 'video' and (v_platform is null or v_source is null) then
    raise exception
      'Video cần có đường dẫn YouTube/TikTok và nguồn (tự làm hay tuyển chọn) trước khi đăng.'
      using errcode = '23514', detail = 'video_incomplete';
  end if;

  update public.posts
     set status = 'published',
         published_at = coalesce(published_at, now())
   where translation_id = p_translation_id;
end;
$$;
```

- [ ] **Step 6: Áp và chạy lại kiểm tra**

Run: `npx supabase db reset && ./scripts/verify-security.sh`
Expected: mọi dòng `PASS`, kể cả C1/C2/H1 cũ; `Tất cả kiểm tra đều đạt.`

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260928000000_video_kind.sql supabase/migrations/20260928000100_video_difficulty.sql scripts/verify-security.sh
git commit -m "feat(db): add video post kind, difficulty, and shared-field publish gate"
```

---

### Task 2: Migration tìm kiếm không dấu

**Files:**
- Create: `supabase/migrations/20260928000200_search.sql`
- Modify: `scripts/verify-security.sh`

**Interfaces:**
- Consumes: cột `posts.plain_text`, `posts.difficulty` (Task 1).
- Produces (DB): `public.f_unaccent(text) returns text`; `public.search_posts(p_query text, p_locale post_locale, p_kinds post_kind[] default '{lesson,forum,video}', p_limit int default 20) returns table (id uuid, kind post_kind, topic text, title text, slug text, excerpt text, cover_image_url text, difficulty post_difficulty, published_at timestamptz, rank real)`.

- [ ] **Step 1: Viết kiểm tra thất bại**

Thêm vào `verify-security.sh`, **trước** khối D2 (vì D2 kích hoạt tài khoản; tìm kiếm phải được kiểm bằng anon):

```bash
echo
echo "S — tìm kiếm không dấu"
check "f_unaccent bỏ dấu cả chữ đ" "Duong ban dan" \
  "$(psql "$DB_URL" -t -A -c "select public.f_unaccent('Đường bán dẫn');")"

sp=$(uuidgen | tr '[:upper:]' '[:lower:]')
sd=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, title, slug, status, published_at) values
  ('$sp', 'vi', 'forum', 'Bán dẫn kiểm tra$$ đã đăng', 'sec-sp-$$', 'published', now()),
  ('$sd', 'vi', 'forum', 'Bán dẫn kiểm tra$$ bản nháp', 'sec-sd-$$', 'draft', null);"

search() {
  curl -s -X POST "$API_URL/rest/v1/rpc/search_posts" -H "apikey: $ANON_KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"p_query\":$1,\"p_locale\":\"vi\"}"
}
hits=$(search "\"ban dan kiem tra$$\"" | grep -o "sec-s[pd]-$$" | sort | tr '\n' ' ')
check "gõ không dấu tìm ra bài có dấu, không lộ bài nháp" "sec-sp-$$ " "$hits"
check "gõ dở từ cuối vẫn ra kết quả" "sec-sp-$$" \
  "$(search "\"kiem tra$$ da d\"" | grep -o "sec-sp-$$" | head -1)"
check "câu chỉ có ký tự cú pháp trả mảng rỗng" "[]" "$(search '"&|!():*' 🙂"')"
long=$(printf 'a%.0s' $(seq 1 10000))
check "câu rất dài vẫn trả 200" "200" "$(status -X POST "$API_URL/rest/v1/rpc/search_posts" \
  -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' \
  -d "{\"p_query\":\"$long\",\"p_locale\":\"vi\"}")"
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx supabase db reset && ./scripts/verify-security.sh`
Expected: các dòng S `FAIL` (hàm chưa tồn tại), thoát mã 1.

- [ ] **Step 3: Viết `20260928000200_search.sql`**

```sql
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
```

- [ ] **Step 4: Áp và chạy lại**

Run: `npx supabase db reset && ./scripts/verify-security.sh`
Expected: toàn bộ `PASS`.

Nếu dòng "câu chỉ có ký tự cú pháp" nhận lỗi thay vì `[]`: kiểm tra `having count(*) > 0` còn nguyên — nó là thứ khiến CTE `q` rỗng (và kết quả rỗng) thay vì gọi `to_tsquery('')`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260928000200_search.sql scripts/verify-security.sh
git commit -m "feat(db): add accent-insensitive full-text search via search_posts"
```

---

### Task 3: Migration hộp thư `messages`

**Files:**
- Create: `supabase/migrations/20260928000300_messages.sql`
- Modify: `scripts/verify-security.sh`

**Interfaces:**
- Produces (DB): enum `message_kind ('contact','feedback','content_error')`; bảng `public.messages (id uuid, kind message_kind, name text, email text, body text, post_id uuid null, locale post_locale, is_handled boolean, created_at timestamptz)`.

- [ ] **Step 1: Viết kiểm tra thất bại**

Thêm vào `verify-security.sh`, **trước** khối D2 (tài khoản phải còn chưa kích hoạt):

```bash
echo
echo "M — hộp thư chỉ ban điều hành đọc được"
psql "$DB_URL" -q -c "insert into public.messages (kind, name, body, locale)
  values ('contact', 'sec-check-$$', 'x', 'vi');" 2>/dev/null || true
msg='{"kind":"contact","name":"x","body":"x","locale":"vi"}'
check "anon không INSERT được tin nhắn" "denied" \
  "$(denied -X POST "$API_URL/rest/v1/messages" -H "apikey: $ANON_KEY" \
     -H 'Content-Type: application/json' -d "$msg")"
check "anon không đọc được tin nhắn" "[]" \
  "$(curl -s "$API_URL/rest/v1/messages?select=id" -H "apikey: $ANON_KEY")"
check "tài khoản chưa kích hoạt không đọc được tin nhắn" "[]" \
  "$(curl -s "$API_URL/rest/v1/messages?select=id" "${auth[@]}")"
```

Và thêm vào `cleanup()`:

```bash
  psql "$DB_URL" -q -c "delete from public.messages where name = 'sec-check-$$';" >/dev/null 2>&1 || true
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx supabase db reset && ./scripts/verify-security.sh`
Expected: các dòng M `FAIL` (bảng chưa có), thoát mã 1.

- [ ] **Step 3: Viết `20260928000300_messages.sql`**

```sql
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
```

- [ ] **Step 4: Áp và chạy lại**

Run: `npx supabase db reset && ./scripts/verify-security.sh`
Expected: toàn bộ `PASS`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260928000300_messages.sql scripts/verify-security.sh
git commit -m "feat(db): add staff-only messages inbox table"
```

---

### Task 4: Đổi Diễn đàn thành Blog

**Files:**
- Move: `src/app/[locale]/dien-dan/` → `src/app/[locale]/blog/`
- Create: `src/lib/legacy-redirects.mjs`, `src/lib/legacy-redirects.test.ts`, `src/messages/keys-parity.test.ts`
- Modify: `src/i18n/routing.ts`, `next.config.mjs`, `src/lib/constants.ts:12`, `src/app/sitemap.ts`, `src/components/layout/langSwitchPath.ts`, `src/components/layout/langSwitchPath.test.ts`, `src/components/sections/LatestPosts.tsx:183`, `src/components/forum/PostCard.tsx:27`, `src/components/forum/CommentSection.tsx:332`, `src/app/[locale]/blog/page.tsx`, `src/app/[locale]/blog/[slug]/page.tsx`, `src/app/[locale]/blog/[slug]/not-found.tsx`, `src/app/admin/actions.ts`, `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Produces: route key `"/blog"` và `"/blog/[slug]"` trong `routing.pathnames` (thay `"/dien-dan"`, `"/dien-dan/[slug]"`); `LEGACY_REDIRECTS: { source: string; destination: string; statusCode: 301 }[]` từ `src/lib/legacy-redirects.mjs`.

- [ ] **Step 1: Viết test thất bại**

`src/lib/legacy-redirects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS } from "@/lib/legacy-redirects.mjs";
import { routing } from "@/i18n/routing";

/**
 * The forum became the blog. Old links in search results and shared posts
 * must keep working, and must say so permanently (301) so search engines move
 * their ranking to the new URL instead of keeping both.
 */
describe("LEGACY_REDIRECTS", () => {
  const blog = routing.pathnames["/blog"];

  it("moves both locales' listing to the blog listing", () => {
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/vi/dien-dan",
      destination: `/vi${blog}`,
      statusCode: 301,
    });
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/en/forum",
      destination: `/en${blog}`,
      statusCode: 301,
    });
  });

  it("keeps the article slug when moving an article", () => {
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/vi/dien-dan/:slug",
      destination: `/vi${blog}/:slug`,
      statusCode: 301,
    });
    expect(LEGACY_REDIRECTS).toContainEqual({
      source: "/en/forum/:slug",
      destination: `/en${blog}/:slug`,
      statusCode: 301,
    });
  });

  it("never points a route at itself", () => {
    for (const rule of LEGACY_REDIRECTS) {
      expect(rule.destination).not.toBe(rule.source);
    }
  });
});
```

`src/messages/keys-parity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import vi from "@/messages/vi.json";
import en from "@/messages/en.json";

function keys(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    keys(value, prefix ? `${prefix}.${key}` : key)
  );
}

/** A key present in one locale only renders as its raw path in the other. */
describe("message catalogues", () => {
  it("have exactly the same keys in Vietnamese and English", () => {
    expect(keys(en).sort()).toEqual(keys(vi).sort());
  });
});
```

Sửa `src/components/layout/langSwitchPath.test.ts`: đổi mọi `"/dien-dan"` thành `"/blog"` và `"/dien-dan/[slug]"` thành `"/blog/[slug]"`; tên test `"sends a forum article to the forum listing"` → `"sends a blog article to the blog listing"`.

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3`
Expected: `legacy-redirects.test.ts` FAIL (không tìm thấy module), `langSwitchPath.test.ts` FAIL (`/blog/[slug]` trả về chính nó). `keys-parity` có thể đã PASS — nó là lưới an toàn cho bước sửa chuỗi.

- [ ] **Step 3: Tạo `src/lib/legacy-redirects.mjs`**

```js
/**
 * Permanent redirects for URLs the site no longer serves.
 *
 * Plain .mjs so next.config.mjs can import it directly; the test imports the
 * same list, so what is tested is what is deployed. `statusCode: 301` rather
 * than `permanent: true`, which makes Next answer 308.
 *
 * @type {{ source: string; destination: string; statusCode: 301 }[]}
 */
export const LEGACY_REDIRECTS = [
  // The forum was renamed to the blog: it only ever held the author's posts.
  { source: "/vi/dien-dan", destination: "/vi/blog", statusCode: 301 },
  { source: "/vi/dien-dan/:slug", destination: "/vi/blog/:slug", statusCode: 301 },
  { source: "/en/forum", destination: "/en/blog", statusCode: 301 },
  { source: "/en/forum/:slug", destination: "/en/blog/:slug", statusCode: 301 },
];
```

- [ ] **Step 4: Nối vào `next.config.mjs`**

Thêm import đầu file:

```js
import { LEGACY_REDIRECTS } from "./src/lib/legacy-redirects.mjs";
```

Thêm vào `nextConfig`, ngay sau `poweredByHeader: false,`:

```js
  async redirects() {
    return LEGACY_REDIRECTS;
  },
```

- [ ] **Step 5: Đổi route**

```bash
git mv "src/app/[locale]/dien-dan" "src/app/[locale]/blog"
```

`src/i18n/routing.ts` — thay hai dòng `"/dien-dan"`:

```ts
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
```

`src/components/layout/langSwitchPath.ts` — trong `SECTION_FALLBACK`:

```ts
  "/blog/[slug]": "/blog",
```

Thay `"/dien-dan"` → `"/blog"` và `"/dien-dan/[slug]"` → `"/blog/[slug]"` ở: `src/lib/constants.ts` (`NAV_ITEMS`), `src/app/sitemap.ts` (`STATIC_ROUTES` và nhánh `pathname`, cả comment nhắc `/dien-dan/[slug]`), `LatestPosts.tsx`, `PostCard.tsx`, `CommentSection.tsx`, `blog/page.tsx` (`localeAlternates`), `blog/[slug]/page.tsx` (mọi chỗ, gồm comment về `/en/dien-dan`), `blog/[slug]/not-found.tsx`.

Kiểm tra không còn sót: `grep -rn "dien-dan" src` chỉ được còn trong `src/lib/legacy-redirects.mjs` và `legacy-redirects.test.ts`.

- [ ] **Step 6: Sửa `revalidatePost` và các action trong `src/app/admin/actions.ts`**

Mọi `` revalidatePath(`/${locale}/dien-dan`) `` và `` `/${locale}/dien-dan/${slug}` `` đổi thành `/blog`. (Trước đây bản EN revalidate `/en/dien-dan`, một URL không tồn tại — trang `/en/forum` chỉ được làm mới nhờ ISR mỗi giờ. Vì cả hai locale giờ cùng là `/blog`, lỗi này tự hết.)

- [ ] **Step 7: Sửa chuỗi**

`src/messages/vi.json`: `nav.forum` → `"Blog"`; `home.latestPosts.headline` → `"Từ Blog"`; `home.latestPosts.empty` → `"Blog chưa có bài viết nào. Quay lại sau nhé!"`; `forum.title` → `"Blog"`; `forum.description` → `"Những bài phân tích, góc nhìn và ghi chép về bán dẫn."`; `forum.backToForum` → `"Về Blog"`.

`src/messages/en.json`: `nav.forum` → `"Blog"`; `home.latestPosts.headline` → `"From the blog"`; `home.latestPosts.empty` → `"The blog has no posts yet. Check back soon!"`; `forum.title` → `"Blog"`; `forum.description` → `"Analysis, perspectives and notes on semiconductors."`; `forum.backToForum` → `"Back to the blog"`.

Tên khoá (`forum`, `backToForum`) giữ nguyên — chúng là định danh nội bộ.

- [ ] **Step 8: Chạy lại**

Run: `npm test -- --maxWorkers=3 && npm run typecheck && npm run lint`
Expected: toàn bộ PASS, 0 lỗi.

- [ ] **Step 9: Commit**

```bash
git add -A src next.config.mjs
git commit -m "feat(blog): rename forum to blog with 301 redirects from old URLs"
```

---

### Task 5: Phân tích link video

**Files:**
- Create: `src/lib/video.ts`, `src/lib/video.test.ts`

**Interfaces:**
- Produces: `type VideoPlatform = "youtube" | "tiktok"`; `type VideoRef = { platform: VideoPlatform; externalId: string }`; `parseVideoUrl(input: string): VideoRef | null`; `embedUrl(ref: VideoRef): string`.

- [ ] **Step 1: Viết test thất bại**

`src/lib/video.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { embedUrl, parseVideoUrl } from "@/lib/video";

const YT = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
const TT = { platform: "tiktok", externalId: "7231338487075638570" } as const;

describe("parseVideoUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    "http://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abc",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "  https://youtu.be/dQw4w9WgXcQ  ",
  ])("reads the YouTube id from %s", (url) => {
    expect(parseVideoUrl(url)).toEqual(YT);
  });

  it.each([
    "https://www.tiktok.com/@chipchip/video/7231338487075638570",
    "https://tiktok.com/@chipchip/video/7231338487075638570?lang=vi",
    "https://www.tiktok.com/embed/v2/7231338487075638570",
  ])("reads the TikTok id from %s", (url) => {
    expect(parseVideoUrl(url)).toEqual(TT);
  });

  it.each([
    "",
    "not a url",
    "javascript:alert(1)",
    "ftp://youtube.com/watch?v=dQw4w9WgXcQ",
    // Lookalike hosts must not pass on the strength of containing "youtube".
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://evil.test/youtu.be/dQw4w9WgXcQ",
    // Wrong id shapes.
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQextra",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/channel/UC1234567890",
    "https://www.tiktok.com/@chipchip/video/abc",
    "https://www.tiktok.com/@chipchip",
  ])("rejects %s", (url) => {
    expect(parseVideoUrl(url)).toBeNull();
  });
});

describe("embedUrl", () => {
  it("embeds YouTube through the no-cookie domain", () => {
    expect(embedUrl(YT)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("embeds TikTok through its v2 player", () => {
    expect(embedUrl(TT)).toBe("https://www.tiktok.com/embed/v2/7231338487075638570");
  });

  it("round-trips: an embed URL parses back to the same reference", () => {
    expect(parseVideoUrl(embedUrl(YT))).toEqual(YT);
    expect(parseVideoUrl(embedUrl(TT))).toEqual(TT);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/video.test.ts`
Expected: FAIL — `Cannot find module '@/lib/video'`.

- [ ] **Step 3: Viết `src/lib/video.ts`**

```ts
/**
 * Video references are stored as (platform, id), never as a URL.
 *
 * Staff paste whatever link the share button gave them; this turns it into
 * the id the database constraint accepts, and `embedUrl` builds the iframe
 * address back from it. Hosts are matched exactly, so a lookalike such as
 * `youtube.com.evil.test` is refused rather than embedded.
 *
 * No server-only imports: the editor (a client component) previews with it.
 */

export type VideoPlatform = "youtube" | "tiktok";
export type VideoRef = { platform: VideoPlatform; externalId: string };

// Must match posts_video_external_id_format in the migration.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^[0-9]{8,25}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);

function youtubeId(url: URL, segments: string[]): string | null {
  if (url.hostname === "youtu.be") return segments[0] ?? null;
  if (segments[0] === "watch") return url.searchParams.get("v");
  if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
    return segments[1] ?? null;
  }
  return null;
}

function tiktokId(segments: string[]): string | null {
  // /@user/video/<id>
  const video = segments.indexOf("video");
  if (video >= 0) return segments[video + 1] ?? null;
  // /embed/v2/<id>
  if (segments[0] === "embed") return segments[segments.length - 1] ?? null;
  return null;
}

export function parseVideoUrl(input: string): VideoRef | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    const id = youtubeId(url, segments);
    return id && YOUTUBE_ID.test(id) ? { platform: "youtube", externalId: id } : null;
  }

  if (TIKTOK_HOSTS.has(host)) {
    const id = tiktokId(segments);
    return id && TIKTOK_ID.test(id) ? { platform: "tiktok", externalId: id } : null;
  }

  return null;
}

export function embedUrl(ref: VideoRef): string {
  const id = encodeURIComponent(ref.externalId);
  return ref.platform === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}`
    : `https://www.tiktok.com/embed/v2/${id}`;
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx vitest run src/lib/video.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit**

```bash
git add src/lib/video.ts src/lib/video.test.ts
git commit -m "feat(video): parse YouTube/TikTok links into ids and build embed URLs"
```

---

### Task 6: Kiểu dữ liệu và truy vấn tìm kiếm

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/queries/posts.ts`

**Interfaces:**
- Consumes: `search_posts` (Task 2); `VideoPlatform` (Task 5).
- Produces: `PostKind = "lesson" | "forum" | "video"`; `Difficulty = "basic" | "intermediate" | "advanced"`; `DIFFICULTIES: readonly Difficulty[]`; `VideoSource = "own" | "curated"`; `PostSummary` có thêm `difficulty: Difficulty | null`; `searchPosts(locale: Locale, query: string, kinds?: PostKind[]): Promise<PostSummary[]>`.

Không có test đơn vị riêng: `searchPosts` là lớp bọc mỏng quanh RPC đã được kiểm bằng khai thác thật ở Task 2; logic duy nhất ở phía TS (bỏ qua câu rỗng) được kiểm ở Task 10 bằng trình duyệt. `tsc` là cổng của task này.

- [ ] **Step 1: Sửa `src/lib/types.ts`**

```ts
export type PostKind = "lesson" | "forum" | "video";
export type PostStatus = "draft" | "published";

export const DIFFICULTIES = ["basic", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type VideoSource = "own" | "curated";
```

Trong `Post`, thêm sau `topic`:

```ts
  difficulty: Difficulty | null;
```

Trong `PostSummary`, thêm `| "difficulty"` vào danh sách `Pick`.

- [ ] **Step 2: Sửa `src/lib/queries/posts.ts`**

Đổi hai hằng cột:

```ts
const SUMMARY_COLUMNS =
  "id, title, slug, excerpt, cover_image_url, kind, topic, difficulty, published_at";

const POST_COLUMNS =
  "id, translation_id, locale, kind, topic, difficulty, title, slug, excerpt, cover_image_url, content, published_at, updated_at";
```

Thêm vào import: `import type { Comment, Difficulty, Post, PostKind, PostSummary } from "@/lib/types";`

Trong `toSummary`, thêm sau `topic`:

```ts
    difficulty: (row.difficulty as Difficulty | null) ?? null,
```

Thêm hàm mới cuối file:

```ts
/**
 * Accent-insensitive search over published posts (see search_posts in the
 * migrations). A blank query never reaches the database.
 */
export async function searchPosts(
  locale: Locale,
  query: string,
  kinds: PostKind[] = ["lesson", "forum", "video"]
): Promise<PostSummary[]> {
  const q = query.trim();
  if (!q) return [];
  if (!requireSupabase("searchPosts")) return [];

  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_posts", {
    p_query: q,
    p_locale: locale,
    p_kinds: kinds,
    p_limit: 30,
  });

  if (error) {
    console.error("[searchPosts]", error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(toSummary);
}
```

- [ ] **Step 3: Kiểm**

Run: `npm run typecheck && npm test -- --maxWorkers=3`
Expected: 0 lỗi, test cũ vẫn PASS. Nếu `tsc` báo chỗ nào dựng `PostSummary` thủ công thiếu `difficulty`, thêm `difficulty: null` tại chỗ đó.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/queries/posts.ts
git commit -m "feat(queries): add video/difficulty types and searchPosts"
```

---

### Task 7: Trường dùng chung của nhóm dịch và các Server Action

**Files:**
- Create: `src/lib/shared-fields.ts`, `src/lib/shared-fields.test.ts`
- Modify: `src/app/admin/actions.ts`

**Interfaces:**
- Consumes: `parseVideoUrl` (Task 5); `Difficulty`, `DIFFICULTIES`, `PostKind`, `VideoSource` (Task 6); `TOPIC_IDS`, `TopicId` (`lib/constants.ts`).
- Produces:
  - `type SharedFieldsInput = { topic: TopicId | null; difficulty: Difficulty | null; videoUrl: string; videoSource: VideoSource | null; channelName: string; relatedLessonTranslationId: string | null }`
  - `type SharedFieldsPatch = { topic: TopicId | null; difficulty: Difficulty | null; video_platform: VideoPlatform | null; video_external_id: string | null; video_source: VideoSource | null; channel_name: string | null; related_lesson_translation_id: string | null }`
  - `buildSharedFieldsPatch(kind: PostKind, input: SharedFieldsInput): { ok: true; patch: SharedFieldsPatch } | { ok: false; error: string }`
  - `isUuid(value: string): boolean`
  - Actions: `saveSharedFields(translationId: string, input: SharedFieldsInput): Promise<ActionResult>`; `rebuildSearchText(): Promise<ActionResult & { updated?: number }>`; `createPost` nhận thêm `difficulty: Difficulty | null` và `kind: PostKind`.

- [ ] **Step 1: Viết test thất bại**

`src/lib/shared-fields.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSharedFieldsPatch, isUuid, type SharedFieldsInput } from "@/lib/shared-fields";

const base: SharedFieldsInput = {
  topic: "nguyen-ly",
  difficulty: "basic",
  videoUrl: "",
  videoSource: null,
  channelName: "",
  relatedLessonTranslationId: null,
};

const LESSON_GROUP = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

describe("buildSharedFieldsPatch", () => {
  it("clears everything but nothing else for a blog post", () => {
    const result = buildSharedFieldsPatch("forum", {
      ...base,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
    });
    expect(result).toEqual({
      ok: true,
      patch: {
        topic: null,
        difficulty: null,
        video_platform: null,
        video_external_id: null,
        video_source: null,
        channel_name: null,
        related_lesson_translation_id: null,
      },
    });
  });

  it("requires a topic for a lesson", () => {
    expect(buildSharedFieldsPatch("lesson", { ...base, topic: null })).toEqual({
      ok: false,
      error: "Bài học cần chọn chủ đề.",
    });
  });

  it("keeps topic and difficulty for a lesson and drops video fields", () => {
    const result = buildSharedFieldsPatch("lesson", {
      ...base,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
      videoSource: "own",
    });
    expect(result.ok && result.patch).toMatchObject({
      topic: "nguyen-ly",
      difficulty: "basic",
      video_platform: null,
      video_external_id: null,
      video_source: null,
    });
  });

  it("turns a pasted link into platform and id for a video", () => {
    const result = buildSharedFieldsPatch("video", {
      ...base,
      topic: null,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s",
      videoSource: "curated",
      channelName: "  Asianometry  ",
      relatedLessonTranslationId: LESSON_GROUP,
    });
    expect(result).toEqual({
      ok: true,
      patch: {
        topic: null,
        difficulty: "basic",
        video_platform: "youtube",
        video_external_id: "dQw4w9WgXcQ",
        video_source: "curated",
        channel_name: "Asianometry",
        related_lesson_translation_id: LESSON_GROUP,
      },
    });
  });

  it("lets a video draft be saved before its link is known", () => {
    const result = buildSharedFieldsPatch("video", base);
    expect(result.ok && result.patch.video_external_id).toBeNull();
  });

  it("refuses a link it cannot read instead of storing nothing silently", () => {
    expect(
      buildSharedFieldsPatch("video", { ...base, videoUrl: "https://vimeo.com/123" })
    ).toEqual({
      ok: false,
      error: "Không đọc được đường dẫn video. Dán link YouTube hoặc TikTok.",
    });
  });

  it("rejects values a crafted request could send", () => {
    expect(
      buildSharedFieldsPatch("lesson", { ...base, topic: "hack" as never }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("lesson", { ...base, difficulty: "expert" as never }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("video", { ...base, videoSource: "stolen" as never }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("video", { ...base, relatedLessonTranslationId: "1; drop" }).ok
    ).toBe(false);
    expect(
      buildSharedFieldsPatch("video", { ...base, channelName: "x".repeat(121) }).ok
    ).toBe(false);
  });
});

describe("isUuid", () => {
  it("accepts a uuid and rejects a malformed translation id", () => {
    expect(isUuid(LESSON_GROUP)).toBe(true);
    expect(isUuid("")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(`${LESSON_GROUP}x`)).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/shared-fields.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết `src/lib/shared-fields.ts`**

```ts
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type PostKind, type VideoSource } from "@/lib/types";
import { parseVideoUrl, type VideoPlatform } from "@/lib/video";

/**
 * Fields a translation group shares: the VI and EN rows must hold the same
 * values, and publish_translation refuses a group where they differ. They are
 * therefore written by one UPDATE over the whole group, never per row.
 *
 * Pure so it can be tested without a database; the Server Action is a thin
 * shell around it. The action is a public HTTP endpoint, so every value is
 * checked here even though the editor only ever sends valid ones.
 */

export type SharedFieldsInput = {
  topic: TopicId | null;
  difficulty: Difficulty | null;
  videoUrl: string;
  videoSource: VideoSource | null;
  channelName: string;
  relatedLessonTranslationId: string | null;
};

export type SharedFieldsPatch = {
  topic: TopicId | null;
  difficulty: Difficulty | null;
  video_platform: VideoPlatform | null;
  video_external_id: string | null;
  video_source: VideoSource | null;
  channel_name: string | null;
  related_lesson_translation_id: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CHANNEL = 120;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

type Result = { ok: true; patch: SharedFieldsPatch } | { ok: false; error: string };

const EMPTY: SharedFieldsPatch = {
  topic: null,
  difficulty: null,
  video_platform: null,
  video_external_id: null,
  video_source: null,
  channel_name: null,
  related_lesson_translation_id: null,
};

export function buildSharedFieldsPatch(kind: PostKind, input: SharedFieldsInput): Result {
  if (kind === "forum") return { ok: true, patch: EMPTY };

  if (input.topic !== null && !TOPIC_IDS.includes(input.topic)) {
    return { ok: false, error: "Chủ đề không hợp lệ." };
  }
  if (input.difficulty !== null && !DIFFICULTIES.includes(input.difficulty)) {
    return { ok: false, error: "Độ khó không hợp lệ." };
  }

  if (kind === "lesson") {
    if (input.topic === null) return { ok: false, error: "Bài học cần chọn chủ đề." };
    return {
      ok: true,
      patch: { ...EMPTY, topic: input.topic, difficulty: input.difficulty },
    };
  }

  // kind === "video"
  if (input.videoSource !== null && input.videoSource !== "own" && input.videoSource !== "curated") {
    return { ok: false, error: "Nguồn video không hợp lệ." };
  }

  const channel = input.channelName.trim();
  if (channel.length > MAX_CHANNEL) {
    return { ok: false, error: `Tên kênh tối đa ${MAX_CHANNEL} ký tự.` };
  }

  const related = input.relatedLessonTranslationId;
  if (related !== null && !isUuid(related)) {
    return { ok: false, error: "Bài học liên quan không hợp lệ." };
  }

  const url = input.videoUrl.trim();
  const ref = url ? parseVideoUrl(url) : null;
  if (url && !ref) {
    return { ok: false, error: "Không đọc được đường dẫn video. Dán link YouTube hoặc TikTok." };
  }

  return {
    ok: true,
    patch: {
      topic: input.topic,
      difficulty: input.difficulty,
      video_platform: ref?.platform ?? null,
      video_external_id: ref?.externalId ?? null,
      video_source: input.videoSource,
      channel_name: channel || null,
      related_lesson_translation_id: related,
    },
  };
}
```

- [ ] **Step 4: Chạy lại test**

Run: `npx vitest run src/lib/shared-fields.test.ts`
Expected: PASS.

- [ ] **Step 5: Sửa `src/app/admin/actions.ts`**

Import thêm:

```ts
import { articleToPlainText } from "@/lib/tiptap/render";
import { buildSharedFieldsPatch, isUuid, type SharedFieldsInput } from "@/lib/shared-fields";
import type { Difficulty, PostKind } from "@/lib/types";
```

(gộp với dòng `import type { PostKind } from "@/lib/types";` sẵn có — đừng để trùng.)

Thêm hằng ngay dưới `SESSION_ENDED`:

```ts
/** Long enough for any real article; the search index ranks body text lowest anyway. */
const PLAIN_TEXT_LIMIT = 20000;
```

Trong `savePost`, thêm vào object `.update({...})`:

```ts
      plain_text: articleToPlainText(input.content, PLAIN_TEXT_LIMIT),
```

Thay chữ ký và phần đầu của `createPost`:

```ts
export async function createPost(args: {
  kind: PostKind;
  topic: TopicId | null;
  difficulty: Difficulty | null;
  title: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string; unauthorized?: boolean; id?: string; translationId?: string }> {
```

và trong hai object của `.insert([...])`, thay dòng `topic:` bằng:

```ts
        topic: args.kind === "forum" ? null : args.topic,
        difficulty: args.kind === "forum" ? null : args.difficulty,
```

Thêm các action mới trước `signOutAndRedirect`:

```ts
/**
 * Writes the fields the VI and EN rows share, in one statement over the whole
 * translation group, so the two rows cannot drift apart.
 */
export async function saveSharedFields(
  translationId: string,
  input: SharedFieldsInput
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  if (!isUuid(translationId)) return fail("Mã bài viết không hợp lệ.");

  const supabase = createClient();

  const { data: group } = await supabase
    .from("posts")
    .select("kind, slug")
    .eq("translation_id", translationId)
    .limit(1)
    .maybeSingle();

  if (!group) return fail("Không tìm thấy bài viết.");

  const kind = group.kind as PostKind;
  const built = buildSharedFieldsPatch(kind, input);
  if (!built.ok) return fail(built.error);

  const { error } = await supabase
    .from("posts")
    .update(built.patch)
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  await revalidatePost(group.slug as string, kind, built.patch.topic);
  return { ok: true };
}

/**
 * Recomputes `plain_text` for every post.
 *
 * `savePost` keeps it current from now on; this covers articles written
 * before the column existed and any row edited by hand in the database.
 * Only rows whose text actually changed are written.
 */
export async function rebuildSearchText(): Promise<ActionResult & { updated?: number }> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();
  const { data, error } = await supabase.from("posts").select("id, content, plain_text");
  if (error) return fail(error.message);

  let updated = 0;
  for (const row of data ?? []) {
    const text = articleToPlainText(row.content, PLAIN_TEXT_LIMIT);
    if (text === row.plain_text) continue;
    const { error: writeError } = await supabase
      .from("posts")
      .update({ plain_text: text })
      .eq("id", row.id);
    if (writeError) return fail(writeError.message);
    updated += 1;
  }

  return { ok: true, updated };
}
```

- [ ] **Step 6: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: `tsc` sẽ báo `NewPostForm.tsx` thiếu `difficulty` khi gọi `createPost` — thêm tạm `difficulty: null` vào lời gọi (Task 9 thay bằng lựa chọn thật). Sau đó 0 lỗi, mọi test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/shared-fields.ts src/lib/shared-fields.test.ts src/app/admin/actions.ts src/components/admin/NewPostForm.tsx
git commit -m "feat(admin): save shared translation-group fields and plain text for search"
```

---

### Task 8: Route nhận tin nhắn `/api/messages`

**Files:**
- Create: `src/lib/contact-message.ts`, `src/lib/contact-message.test.ts`, `src/app/api/messages/route.ts`

**Interfaces:**
- Consumes: bảng `messages` (Task 3); `consume_rate_limit`, `clientIp`, `hashIp` (sẵn có); `routing.locales`.
- Produces: `type MessageKind = "contact" | "feedback" | "content_error"`; `type MessageInput = { kind: MessageKind; name: string; email: string | null; body: string; postId: string | null; locale: Locale }`; `parseMessagePayload(payload: unknown): { ok: true; honeypot: true } | { ok: true; honeypot: false; value: MessageInput } | { ok: false; error: string }`. HTTP: `POST /api/messages` → `200 {ok:true}` | `400 {error}` | `404 {error:"post_not_found"}` | `429 {error:"rate_limited"}` | `503`.

- [ ] **Step 1: Viết test thất bại**

`src/lib/contact-message.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseMessagePayload } from "@/lib/contact-message";

const valid = {
  kind: "feedback",
  name: "  Lan  ",
  email: " lan@example.com ",
  body: "  Bài hay quá!  ",
  locale: "vi",
};

describe("parseMessagePayload", () => {
  it("trims and accepts a well-formed message", () => {
    expect(parseMessagePayload(valid)).toEqual({
      ok: true,
      honeypot: false,
      value: {
        kind: "feedback",
        name: "Lan",
        email: "lan@example.com",
        body: "Bài hay quá!",
        postId: null,
        locale: "vi",
      },
    });
  });

  it("treats a filled hidden field as a bot", () => {
    expect(parseMessagePayload({ ...valid, website: "http://spam.test" })).toEqual({
      ok: true,
      honeypot: true,
    });
  });

  it("makes email optional", () => {
    const result = parseMessagePayload({ ...valid, email: "" });
    expect(result.ok && !result.honeypot && result.value.email).toBeNull();
  });

  it.each([
    [{ ...valid, kind: "spam" }, "kind_invalid"],
    [{ ...valid, name: "" }, "name_length"],
    [{ ...valid, name: "x".repeat(81) }, "name_length"],
    [{ ...valid, body: "   " }, "body_length"],
    [{ ...valid, body: "x".repeat(4001) }, "body_length"],
    [{ ...valid, email: "not-an-email" }, "email_invalid"],
    [{ ...valid, email: `${"x".repeat(250)}@a.io` }, "email_invalid"],
    [{ ...valid, locale: "fr" }, "locale_invalid"],
    [{ ...valid, postId: "not-a-uuid" }, "post_invalid"],
  ])("rejects %o with %s", (payload, error) => {
    expect(parseMessagePayload(payload)).toEqual({ ok: false, error });
  });

  it("rejects non-string fields instead of throwing", () => {
    for (const bad of [["x"], { a: 1 }, 42, null, true]) {
      expect(parseMessagePayload({ ...valid, name: bad }).ok).toBe(false);
      expect(parseMessagePayload({ ...valid, body: bad }).ok).toBe(false);
      expect(parseMessagePayload({ ...valid, kind: bad }).ok).toBe(false);
    }
  });

  it("rejects a payload that is not an object", () => {
    for (const bad of [null, "text", 1, []]) {
      expect(parseMessagePayload(bad)).toEqual({ ok: false, error: "invalid_payload" });
    }
  });

  it("accepts a content error tied to an article", () => {
    const result = parseMessagePayload({
      ...valid,
      kind: "content_error",
      postId: "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e",
    });
    expect(result.ok && !result.honeypot && result.value.postId).toBe(
      "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e"
    );
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/contact-message.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết `src/lib/contact-message.ts`**

```ts
import { routing, type Locale } from "@/i18n/routing";
import { isUuid } from "@/lib/shared-fields";

/**
 * Validation for /api/messages, kept pure so every rejection can be tested
 * without a request. Anything that is not the expected type is refused with a
 * code rather than coerced — `String(["x"])` would otherwise sail through.
 */

export const MESSAGE_KINDS = ["contact", "feedback", "content_error"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export type MessageInput = {
  kind: MessageKind;
  name: string;
  email: string | null;
  body: string;
  postId: string | null;
  locale: Locale;
};

type Result =
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; value: MessageInput }
  | { ok: false; error: string };

// Must match the CHECK constraints on public.messages.
const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_BODY = 4000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

export function parseMessagePayload(payload: unknown): Result {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "invalid_payload" };
  }
  const p = payload as Record<string, unknown>;

  // A real reader never fills a field they cannot see.
  if (typeof p.website === "string" && p.website.trim() !== "") {
    return { ok: true, honeypot: true };
  }

  const kind = text(p.kind);
  if (!kind || !(MESSAGE_KINDS as readonly string[]).includes(kind)) {
    return { ok: false, error: "kind_invalid" };
  }

  const name = text(p.name);
  if (!name || name.length > MAX_NAME) return { ok: false, error: "name_length" };

  const body = text(p.body);
  if (!body || body.length > MAX_BODY) return { ok: false, error: "body_length" };

  const email = p.email === undefined || p.email === null ? "" : text(p.email);
  if (email === null || (email && (email.length > MAX_EMAIL || !EMAIL.test(email)))) {
    return { ok: false, error: "email_invalid" };
  }

  const locale = text(p.locale);
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    return { ok: false, error: "locale_invalid" };
  }

  const postId = p.postId === undefined || p.postId === null ? null : text(p.postId);
  if (postId !== null && !isUuid(postId)) return { ok: false, error: "post_invalid" };

  return {
    ok: true,
    honeypot: false,
    value: {
      kind: kind as MessageKind,
      name,
      email: email || null,
      body,
      postId,
      locale: locale as Locale,
    },
  };
}
```

- [ ] **Step 4: Chạy lại test**

Run: `npx vitest run src/lib/contact-message.test.ts`
Expected: PASS.

- [ ] **Step 5: Viết `src/app/api/messages/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { clientIp, hashIp } from "@/lib/rate-limit";
import { parseMessagePayload } from "@/lib/contact-message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_WINDOW = 3;
const WINDOW_MINUTES = 60;

/**
 * Contact, feedback and content-error messages.
 *
 * The only writer of public.messages: the table has no insert policy, so the
 * checks here — honeypot, validation, rate limit — cannot be skipped by
 * talking to PostgREST directly.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseMessagePayload(payload);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  // Answer a bot with success so it does not learn to skip the field.
  if (parsed.honeypot) return NextResponse.json({ ok: true });

  const message = parsed.value;
  const admin = createAdminClient();

  if (message.postId) {
    const { data: post } = await admin
      .from("posts")
      .select("id")
      .eq("id", message.postId)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  const { data: allowed, error: limitError } = await admin.rpc("consume_rate_limit", {
    p_scope: "message",
    p_key: hashIp(clientIp(request.headers)),
    p_limit: MAX_PER_WINDOW,
    p_window_minutes: WINDOW_MINUTES,
  });

  if (limitError) {
    console.error("[messages] rate limit failed", limitError.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  if (!allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { error } = await admin.from("messages").insert({
    kind: message.kind,
    name: message.name,
    email: message.email,
    body: message.body,
    post_id: message.postId,
    locale: message.locale,
  });

  if (error) {
    console.error("[messages] insert failed", error.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, mọi test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contact-message.ts src/lib/contact-message.test.ts src/app/api/messages/route.ts
git commit -m "feat(api): accept contact messages with honeypot and rate limit"
```

---

### Task 9: Admin — hộp thư, nút dựng lại tìm kiếm, bài video và độ khó

**Files:**
- Create: `src/app/admin/(dashboard)/tin-nhan/page.tsx`, `src/components/admin/MessageActions.tsx`, `src/components/admin/RebuildSearchButton.tsx`
- Modify: `src/app/admin/actions.ts`, `src/components/admin/AdminNav.tsx`, `src/app/admin/(dashboard)/page.tsx`, `src/components/admin/NewPostForm.tsx`, `src/app/admin/(dashboard)/bai-viet/page.tsx`, `src/app/admin/(dashboard)/bai-viet/[id]/page.tsx`

**Interfaces:**
- Consumes: `rebuildSearchText`, `createPost` (Task 7); `DIFFICULTIES`, `Difficulty`, `PostKind` (Task 6); bảng `messages` (Task 3).
- Produces: actions `setMessageHandled(id: string, handled: boolean): Promise<ActionResult>`, `deleteMessage(id: string): Promise<ActionResult>`; route `/admin/tin-nhan?filter=all`.

Trang admin là giao diện server-render mỏng quanh action đã kiểm; phần kiểm là `tsc` + kiểm bằng trình duyệt ở Task 10.

- [ ] **Step 1: Action cho tin nhắn** — thêm vào `src/app/admin/actions.ts` trước `signOutAndRedirect`:

```ts
export async function setMessageHandled(
  messageId: string,
  handled: boolean
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(messageId)) return fail("Mã tin nhắn không hợp lệ.");

  const { error } = await createClient()
    .from("messages")
    .update({ is_handled: handled })
    .eq("id", messageId);

  if (error) return fail(error.message);
  revalidatePath("/admin/tin-nhan");
  return { ok: true };
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(messageId)) return fail("Mã tin nhắn không hợp lệ.");

  const { error } = await createClient().from("messages").delete().eq("id", messageId);
  if (error) return fail(error.message);
  revalidatePath("/admin/tin-nhan");
  return { ok: true };
}
```

- [ ] **Step 2: `src/components/admin/MessageActions.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { deleteMessage, setMessageHandled } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";

export function MessageActions({
  messageId,
  handled,
}: {
  messageId: string;
  handled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = readActionResult(await fn());
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok) {
        setError(result.error ?? "Thao tác thất bại.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          title={handled ? "Đánh dấu chưa xử lý" : "Đánh dấu đã xử lý"}
          onClick={() => run(() => setMessageHandled(messageId, !handled))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-accent disabled:opacity-50"
        >
          {handled ? (
            <RotateCcw className="size-4" strokeWidth={2} />
          ) : (
            <Check className="size-4" strokeWidth={2} />
          )}
        </button>

        {confirming ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteMessage(messageId))}
              className="cursor-pointer rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Xoá
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer px-1 text-[11px] text-text-muted underline"
            >
              Huỷ
            </button>
          </>
        ) : (
          <button
            type="button"
            title="Xoá vĩnh viễn"
            onClick={() => setConfirming(true)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: `src/app/admin/(dashboard)/tin-nhan/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { MessageActions } from "@/components/admin/MessageActions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: "contact" | "feedback" | "content_error";
  name: string;
  email: string | null;
  body: string;
  post_id: string | null;
  locale: "vi" | "en";
  is_handled: boolean;
  created_at: string;
};

const KIND_LABEL: Record<Row["kind"], string> = {
  contact: "Liên hệ",
  feedback: "Góp ý",
  content_error: "Báo lỗi nội dung",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  await requireStaff();
  const supabase = createClient();
  const showAll = searchParams.filter === "all";

  // RLS lets only activated staff read this table, email included.
  let query = supabase
    .from("messages")
    .select("id, kind, name, email, body, post_id, locale, is_handled, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!showAll) query = query.eq("is_handled", false);

  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const postIds = Array.from(new Set(rows.flatMap((r) => (r.post_id ? [r.post_id] : []))));
  const titles = new Map<string, string>();
  if (postIds.length > 0) {
    const { data: posts } = await supabase.from("posts").select("id, title").in("id", postIds);
    for (const post of posts ?? []) titles.set(post.id, post.title || "(chưa có tiêu đề)");
  }

  const tabs = [
    { href: "/admin/tin-nhan", label: "Chưa xử lý", active: !showAll },
    { href: "/admin/tin-nhan?filter=all", label: "Tất cả", active: showAll },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Tin nhắn</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Liên hệ, góp ý và báo lỗi nội dung từ người đọc.
        </p>
      </div>

      <nav className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              tab.active
                ? "border-border bg-surface-muted text-accent"
                : "border-border bg-surface text-text-nav hover:border-black/20"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          {showAll ? "Chưa có tin nhắn nào." : "Không còn tin nào chờ xử lý."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className={
                row.is_handled
                  ? "flex gap-4 rounded-2xl border border-border bg-surface-muted p-5 opacity-70"
                  : "flex gap-4 rounded-2xl border border-border bg-surface p-5"
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-nav">
                    {KIND_LABEL[row.kind]}
                  </span>
                  <span className="text-sm font-semibold text-text">{row.name}</span>
                  <span className="text-[11px] uppercase text-text-muted">{row.locale}</span>
                  <time dateTime={row.created_at} className="text-xs text-text-muted">
                    {new Date(row.created_at).toLocaleString("vi-VN")}
                  </time>
                </div>

                {row.email && (
                  <a
                    href={`mailto:${row.email}`}
                    className="mt-0.5 block font-mono text-[11px] text-text-muted hover:text-accent"
                  >
                    {row.email}
                  </a>
                )}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-nav">
                  {row.body}
                </p>

                {row.post_id && (
                  <p className="mt-2 text-xs text-text-muted">
                    Về bài:{" "}
                    <Link
                      href={`/admin/bai-viet/${row.post_id}`}
                      className="text-text-nav underline hover:text-accent"
                    >
                      {titles.get(row.post_id) ?? "(bài đã bị xoá)"}
                    </Link>
                  </p>
                )}
              </div>

              <MessageActions messageId={row.id} handled={row.is_handled} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Nav** — `src/components/admin/AdminNav.tsx`, thêm vào `ITEMS` sau mục Bình luận:

```ts
  { href: "/admin/tin-nhan", label: "Tin nhắn" },
```

- [ ] **Step 5: `src/components/admin/RebuildSearchButton.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rebuildSearchText } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";

/** One-off after the search migration; harmless to press again later. */
export function RebuildSearchButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () => {
    setMessage(null);
    startTransition(async () => {
      const result = readActionResult(await rebuildSearchText());
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      setMessage(
        result.ok
          ? `Đã cập nhật chỉ mục tìm kiếm cho ${result.updated ?? 0} bản.`
          : result.error ?? "Không cập nhật được."
      );
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-5 text-sm font-medium text-text-nav transition-colors hover:border-black/20 hover:text-accent disabled:opacity-60"
      >
        {pending ? "Đang cập nhật…" : "Cập nhật chỉ mục tìm kiếm"}
      </button>
      {message && (
        <p role="status" className="text-sm text-text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Dashboard** — `src/app/admin/(dashboard)/page.tsx`:

Đổi kiểu tham số `countRows`: `table: "posts" | "comments" | "messages"`.

Thêm `unhandledMessages` vào `Promise.all` (`countRows("messages", { is_handled: false })`) và vào `stats`: `{ label: "Tin nhắn chưa xử lý", value: unhandledMessages }`. Đổi lưới thành `lg:grid-cols-3` (6 ô).

Import `RebuildSearchButton` và đặt `<RebuildSearchButton />` ngay sau khối `<div className="flex flex-wrap gap-3">` chứa hai nút sẵn có.

- [ ] **Step 7: Form bài mới** — `src/components/admin/NewPostForm.tsx`:

Import: `import { DIFFICULTIES, type Difficulty, type PostKind } from "@/lib/types";`

Thêm hằng dưới `TOPIC_TITLE`:

```ts
const DIFFICULTY_TITLE: Record<Difficulty, string> = {
  basic: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};
```

State: `const [kind, setKind] = useState<PostKind>("forum");`, thêm `const [difficulty, setDifficulty] = useState<Difficulty>("basic");`.

Lời gọi `createPost`:

```ts
        await createPost({
          kind,
          topic: kind === "forum" ? null : topic,
          difficulty: kind === "forum" ? null : difficulty,
          title,
          slug,
        })
```

Danh sách loại bài:

```ts
              { value: "forum", label: "Blog" },
              { value: "lesson", label: "Bài học" },
              { value: "video", label: "Video" },
```

Đổi điều kiện hiện khối Chủ đề từ `kind === "lesson"` thành `kind !== "forum"`, và ngay sau khối đó thêm:

```tsx
      {kind !== "forum" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-text">Độ khó</legend>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                aria-pressed={difficulty === level}
                className={cn(
                  "cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  difficulty === level
                    ? "border-border bg-surface-muted text-accent"
                    : "border-border bg-surface text-text-nav hover:border-black/20"
                )}
              >
                {DIFFICULTY_TITLE[level]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
```

(Video luôn có chủ đề trong form này cho gọn; `saveSharedFields` ở DA2 sẽ cho bỏ chọn.)

- [ ] **Step 8: Nhãn loại bài trong admin**

`bai-viet/page.tsx`: `kind: "lesson" | "forum" | "video";` trong `Row`, và
`const KIND_LABEL = { lesson: "Bài học", forum: "Blog", video: "Video" } as const;`

`bai-viet/[id]/page.tsx`: `kind: "lesson" | "forum" | "video";` trong `Row`, và thay biểu thức nhãn:

```tsx
          {{ lesson: "Bài học", forum: "Blog", video: "Video" }[primary.kind]}
```

- [ ] **Step 9: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: 0 lỗi, mọi test PASS, build thành công.

- [ ] **Step 10: Commit**

```bash
git add src/app/admin src/components/admin
git commit -m "feat(admin): add inbox, search rebuild button, video posts with difficulty"
```

---

### Task 10: Nghiệm thu toàn bộ DA1

**Files:** không tạo file mới. Sửa chỗ hỏng nếu nghiệm thu phát hiện, mỗi lỗi một commit `fix:`.

- [ ] **Step 1: Cổng cục bộ**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: tất cả xanh. Ghi số test trong báo cáo.

- [ ] **Step 2: DB từ đầu**

Run: `npx supabase db reset && ./scripts/verify-security.sh`
Expected: `Tất cả kiểm tra đều đạt.` với đủ nhóm C1, C2, H1, S, M, D1, D2.

- [ ] **Step 3: Chạy app trên stack local**

Run: `NODE_ENV=development npx next dev -p 3000` (shell có sẵn `NODE_ENV=production` sẽ làm middleware chết — xem README).

- [ ] **Step 4: Kiểm bằng trình duyệt** (đăng nhập admin local theo `docs/BAN-GIAO.md` mục 1)

1. `/admin/bai-viet/moi` → tạo một Bài học, độ khó "Trung bình", nội dung có chữ "bán dẫn loại n"; điền bản EN; bấm Đăng → thành công.
2. Tạo một Blog → khối Độ khó không hiện; đăng được.
3. Tạo một Video → lưu được bản nháp; bấm Đăng → báo *"Video cần có đường dẫn…"* (UI nhập link thuộc DA2).
4. `/admin` → bấm "Cập nhật chỉ mục tìm kiếm" → báo số bản đã cập nhật.
5. Mở trang Blog công khai: `/vi/blog` và `/en/blog` hiện danh sách; menu ghi "Blog".
6. `/vi/dien-dan?page=2` → chuyển tới `/vi/blog?page=2` (DevTools → Network: mã **301**, query còn nguyên). `/en/forum/<slug>` → `/en/blog/<slug>`.
7. Gọi thử API tìm kiếm trong console trình duyệt ở trang bất kỳ:
   `await fetch("http://127.0.0.1:54321/rest/v1/rpc/search_posts",{method:"POST",headers:{apikey:"<anon key local>","Content-Type":"application/json"},body:JSON.stringify({p_query:"ban dan loai n",p_locale:"vi"})}).then(r=>r.json())` → có bài học vừa đăng.
8. Gửi 4 tin liên tiếp:
   `for (let i=0;i<4;i++) console.log((await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"feedback",name:"Test",body:"Xin chào "+i,locale:"vi"})})).status)` → `200 200 200 429`.
9. `/admin/tin-nhan` → thấy 3 tin; đánh dấu một tin đã xử lý → biến khỏi tab "Chưa xử lý", có trong "Tất cả"; xoá một tin có xác nhận.
10. Chuyển ngôn ngữ trên một bài blog → về `/en/blog`, không lỗi.

- [ ] **Step 5: Cập nhật tài liệu**

`README.md`: bảng URL song ngữ đổi `/vi/dien-dan | /en/forum` thành `/vi/blog | /en/blog`; cây thư mục `dien-dan/` → `blog/`; thêm `api/messages/` và `/admin/tin-nhan`; mục "Lên production" thêm bước bấm "Cập nhật chỉ mục tìm kiếm" sau `db push`; xoá dòng "Chưa có test tự động trong repo" (đã sai).

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: update README for blog, inbox, and search"
```
