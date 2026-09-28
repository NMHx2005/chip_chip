# DA1 — Nền dữ liệu

Ngày: 28/09/2026 · Trạng thái: chờ duyệt · Lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md`

## 1. Mục tiêu

Dựng tầng dữ liệu mà bốn dự án con sau cần: video là một loại bài, độ khó, tìm kiếm
không dấu, hộp thư liên hệ; đổi Diễn đàn thành Blog. DA1 **không** làm giao diện
công khai mới (đó là DA3, DA4) và không làm UI soạn trường video trong editor (DA2).

**Xong khi:**
- Ba migration mới áp sạch bằng `npx supabase db reset` trên stack local.
- `search_posts` tìm "ban dan" ra bài có "bán dẫn"; không trả bài nháp.
- `/api/messages` nhận tin, chặn honeypot, giới hạn tần suất; `/admin/tin-nhan` đọc được.
- `/vi/dien-dan/x` và `/en/forum/x` trả 301 về `/vi/blog/x`, `/en/blog/x`.
- `tsc`, `lint`, `vitest`, `build` sạch; `verify-security.sh` xanh cả kiểm tra cũ và mới.

## 2. Migration

Chỉ thêm file mới. Không sửa `20260912000000_init.sql` hay `20260913000000_harden_access.sql`.

### 2.1 `20260928000000_video_kind.sql`

```sql
alter type public.post_kind add value if not exists 'video';
```

Đứng riêng vì Postgres không cho dùng giá trị enum vừa thêm trong cùng giao dịch —
mọi constraint nhắc đến `'video'` phải ở file sau.

### 2.2 `20260928000100_video_difficulty.sql`

Enum mới:

```sql
create type public.post_difficulty as enum ('basic', 'intermediate', 'advanced');
create type public.video_platform  as enum ('youtube', 'tiktok');
create type public.video_source    as enum ('own', 'curated');
```

Cột mới trên `posts` (đều nullable — bài cũ không bị ảnh hưởng):

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `difficulty` | `post_difficulty` | `kind <> 'forum' or difficulty is null` |
| `video_platform` | `video_platform` | chỉ khác null khi `kind = 'video'` |
| `video_external_id` | text | YouTube `^[A-Za-z0-9_-]{11}$`, TikTok `^[0-9]{8,25}$`; đi cặp với `video_platform` (cùng null hoặc cùng có) |
| `video_source` | `video_source` | chỉ khác null khi `kind = 'video'` |
| `channel_name` | text | ≤ 120 ký tự |
| `related_lesson_translation_id` | uuid | chỉ khác null khi `kind = 'video'` |
| `plain_text` | text | không ràng buộc; ghi bởi server |

**Chỉ lưu ID video, không lưu URL.** Server tự dựng URL nhúng từ `(platform, id)`,
nên không có đường nào khiến trang nhúng iframe từ một URL tuỳ ý.

Thay constraint `posts_topic_only_for_lessons` bằng
`posts_topic_for_lessons_and_videos`: `topic is null or kind in ('lesson', 'video')`.

`related_lesson_translation_id` không có khoá ngoại vì `translation_id` không unique
(mỗi nhóm có hai dòng). Truy vấn chỉ join với bài học **đã đăng**, nên liên kết tới
bài bị xoá/gỡ đăng tự biến mất khỏi giao diện thay vì lỗi.

Chỉ mục: `posts_video_lesson_idx on (related_lesson_translation_id) where kind = 'video'`,
và mở rộng chỉ mục listing sẵn có để lọc theo `difficulty`.

**`publish_translation()` viết lại** (`create or replace`, cùng chữ ký), giữ hai kiểm
tra cũ và thêm:

1. Các trường dùng chung — `kind, topic, difficulty, video_platform,
   video_external_id, video_source, channel_name, related_lesson_translation_id` —
   phải giống nhau ở mọi dòng của nhóm (`count(distinct (...)) = 1`).
2. `kind in ('lesson', 'video')` thì `difficulty is not null`.
3. `kind = 'video'` thì `video_platform`, `video_external_id`, `video_source` khác null.

Thông báo lỗi tiếng Việt, `errcode = '23514'`, như hàm hiện tại.

### 2.3 `20260928000200_search_and_messages.sql`

**Tìm kiếm**

```sql
create extension if not exists unaccent with schema extensions;

-- unaccent() is STABLE, so it cannot back a generated column or an index.
-- Pinning the dictionary makes the wrapper safe to declare IMMUTABLE.
create or replace function public.f_unaccent(text)
returns text language sql immutable parallel safe strict
set search_path = public, extensions
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;
```

`unaccent.rules` mặc định đã chuyển `đ/Đ` → `d/D`; `verify-security.sh` khẳng định
`f_unaccent('Đường bán dẫn') = 'Duong ban dan'` để bắt trường hợp môi trường nào đó
dùng bộ luật khác.

Cột `search_vector tsvector generated always as (...) stored` với cấu hình `'simple'`
(Postgres không có từ điển tiếng Việt), trọng số tiêu đề `A`, tóm tắt `B`,
`plain_text` `C`, tất cả đã qua `lower(f_unaccent(...))`. Chỉ mục GIN.

Hàm `search_posts(p_query text, p_locale post_locale, p_kinds post_kind[], p_limit int)`:

- `security invoker` — chạy dưới RLS như truy vấn thường, anon chỉ thấy bài đã đăng.
  Thêm `status = 'published'` trong thân hàm như một lớp nữa.
- Cắt `p_query` còn 100 ký tự, `p_limit` kẹp trong `[1, 50]`.
- Tách câu truy vấn bằng `regexp_split_to_table(lower(f_unaccent(q)), '[^[:alnum:]]+')`,
  bỏ token rỗng, mỗi token thành `token:*`, nối bằng `&`. Vì token chỉ còn chữ-số nên
  không có ký tự cú pháp tsquery nào lọt vào — không cần escape ở JS.
- Trả `id, kind, topic, title, slug, excerpt, cover_image_url, difficulty,
  published_at, rank`, sắp theo `ts_rank` rồi `published_at desc`.
- Câu truy vấn rỗng sau khi tách thì trả tập rỗng.

**Hộp thư**

```sql
create type public.message_kind as enum ('contact', 'feedback', 'content_error');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  kind public.message_kind not null,
  name text not null,           -- 1..80
  email text,                   -- ≤ 254, tuỳ chọn
  body text not null,           -- 1..4000
  post_id uuid references public.posts (id) on delete set null,
  locale public.post_locale not null,
  is_handled boolean not null default false,
  created_at timestamptz not null default now()
);
```

RLS bật. Policy `select / update / delete` cho `authenticated` qua `is_staff()`.
**Không có policy insert** — mọi tin đi qua `/api/messages` bằng service role, như
bình luận. Chỉ mục `(is_handled, created_at desc)`.

## 3. Code

### 3.1 Kiểu và truy vấn

- `lib/types.ts`: `PostKind` thêm `"video"`; kiểu `Difficulty`, `VideoRef`
  (`platform`, `externalId`, `source`, `channelName`); `PostSummary` thêm `difficulty`.
- `lib/queries/posts.ts`: `SUMMARY_COLUMNS` thêm `difficulty`; hàm mới
  `searchPosts(locale, query, kinds?)` gọi RPC, trả `[]` khi thiếu Supabase như các
  hàm khác.
- `lib/video.ts` (mới, không phụ thuộc server): `parseVideoUrl(url)` →
  `{ platform, externalId } | null`, nhận `youtube.com/watch?v=`, `youtu.be/`,
  `youtube.com/shorts/`, `youtube.com/embed/`, `tiktok.com/@user/video/<id>`;
  `embedUrl(ref)` dựng `https://www.youtube-nocookie.com/embed/<id>` hoặc
  `https://www.tiktok.com/embed/v2/<id>`.

### 3.2 Server Actions (`app/admin/actions.ts`)

- `savePost`: tính `plain_text` bằng `articleToPlainText(content, 20000)` và ghi cùng lần.
- `createPost`: nhận `kind: "video"`, và `difficulty` tuỳ chọn ghi cho cả hai dòng.
- **`saveSharedFields(translationId, fields)`** (mới): một câu
  `update posts set ... where translation_id = $1` cho `topic, difficulty` và các
  trường video, nên hai bản không thể lệch. Nhận URL video thô, parse bằng
  `parseVideoUrl` ở server; URL không hợp lệ → lỗi, không ghi. Trả `ActionResult`,
  không redirect, bắt đầu bằng `lookUpStaff()` như mọi action khác.
- `setMessageHandled(id, handled)`, `deleteMessage(id)` (mới).
- `revalidatePost` thêm nhánh cho `video` và dùng đường `/blog`.

UI cho `saveSharedFields` thuộc DA2; DA1 chỉ cần action có test.

### 3.3 `/api/messages` (mới)

Cùng khuôn với `api/comments/route.ts`: `runtime = "nodejs"`, honeypot `website`
(trả `ok` giả), kiểm tra độ dài, email tuỳ chọn khớp regex, `kind` thuộc enum,
`post_id` nếu có phải là bài đã đăng, `locale` thuộc `routing.locales`.
Rate limit: `consume_rate_limit('message', hashIp(clientIp(...)), 3, 60)`.
Phần kiểm tra payload tách thành hàm thuần `parseMessagePayload` để test không cần mạng.

### 3.4 Admin

- `/admin/tin-nhan`: danh sách mới nhất trước, lọc chưa xử lý / tất cả, nút đánh dấu
  đã xử lý và xoá (có xác nhận). Đọc bằng client theo phiên (RLS staff), trang gọi
  `requireStaff()`.
- `AdminNav` thêm mục Tin nhắn; trang tổng quan hiện số tin chưa xử lý.
- Danh sách bài viết hiển thị được `kind = 'video'`; `NewPostForm` có lựa chọn Video.

### 3.5 Đổi Diễn đàn → Blog

- Enum nội bộ giữ `'forum'`; thư mục `components/forum/` giữ nguyên.
- `i18n/routing.ts`: key `/dien-dan` → `/blog`, `/dien-dan/[slug]` → `/blog/[slug]`,
  vi và en đều là `/blog`.
- Đổi thư mục `app/[locale]/dien-dan` → `app/[locale]/blog`.
- Sửa theo: `constants.ts` (`NAV_ITEMS`), `sitemap.ts`, `langSwitchPath.ts` (+ test),
  `LatestPosts.tsx`, admin pages, `messages/{vi,en}.json` (nhãn "Blog",
  "Về Blog"…).
- `next.config.mjs` `redirects()`, `permanent: true`:
  `/vi/dien-dan` và `/vi/dien-dan/:slug` → `/vi/blog…`;
  `/en/forum` và `/en/forum/:slug` → `/en/blog…`.

### 3.6 Backfill `plain_text`

`scripts/backfill-plain-text.ts`: đọc mọi dòng `posts` bằng service role, tính
`plain_text` bằng cùng hàm với `savePost`, ghi dòng nào khác giá trị hiện có.
Mặc định `--dry-run` (chỉ in số dòng sẽ đổi); phải truyền `--apply` mới ghi.
Từ chối chạy nếu thiếu biến môi trường. Bài chưa backfill vẫn tìm được theo tiêu đề
và tóm tắt.

## 4. Kiểm thử

**Vitest (thuần, không mạng):**
- `parseVideoUrl` / `embedUrl`: mọi dạng link YouTube ở 3.1, link TikTok, `http`,
  có/không `www`, tham số thừa (`&t=30s`), link rác, ID sai độ dài, host giả
  (`youtube.com.evil.test`).
- `parseMessagePayload`: thiếu trường, quá dài, email sai, `kind` lạ, honeypot.
- `safePathFor` với đường `/blog/[slug]`.
- Bảng redirect: hàm dựng danh sách redirect được export và test.
- Số khoá `vi.json` = `en.json` (test sẵn có phải còn xanh).

**`scripts/verify-security.sh` — thêm, chạy trên stack local:**
- anon `insert` vào `messages` → bị chặn; anon `select` → rỗng.
- user đăng ký nhưng chưa kích hoạt `select messages` → rỗng.
- `search_posts` bằng anon không trả bài nháp, kể cả khi tiêu đề khớp.
- Hai dòng cùng nhóm lệch `difficulty` → `publish_translation` từ chối.
- Video thiếu `video_external_id` → `publish_translation` từ chối.
- Ghi `video_external_id = 'javascript:alert(1)'` → constraint chặn.

**Kiểm bằng trình duyệt (stack local):** URL cũ ra 301 và tới đúng bài; tìm "ban dan"
ra bài "bán dẫn"; gửi form tin nhắn lần thứ 4 trong giờ nhận 429; tin hiện trong
`/admin/tin-nhan`.

## 5. Triển khai lên production

1. `pg_dump` bản sao lưu.
2. `npx supabase db reset` local, chạy đủ kiểm thử ở mục 4.
3. `npx supabase db push`.
4. `backfill-plain-text.ts` chạy `--dry-run`, xem số dòng, rồi `--apply`.
5. Deploy code. Thứ tự này quan trọng: code mới đọc cột mới, nên migration phải đi trước.

## 6. Rủi ro đã biết

- Cấu hình `'simple'` tách "bán dẫn" thành hai token; tìm cụm vẫn đúng vì nối bằng
  `&`, nhưng xếp hạng không hiểu từ ghép. Chấp nhận ở quy mô vài trăm bài.
- Tiền tố trên mọi token có thể khớp rộng với token một ký tự ("a" khớp mọi thứ bắt
  đầu bằng a). Bỏ token dài 1 ký tự trừ khi nó là token duy nhất.
- `plain_text` có thể lệch với `content` nếu ai sửa DB bằng tay; lưu lại bài trong CMS
  hoặc chạy lại backfill là khớp.
