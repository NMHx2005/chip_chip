# Project Chíp Chíp — Website

Website cộng đồng học tập bán dẫn phi lợi nhuận cho học sinh trung học phổ thông.
Song ngữ Việt / Anh, gồm các mục công khai — **Trang chủ · Bài học · Video · Blog ·
Tìm kiếm · Giới thiệu · Liên hệ · Đóng góp · Chính sách bảo mật** — và một trang
quản trị để ban điều hành soạn bài, duyệt bình luận, đọc tin nhắn.

## Chạy dự án

```bash
npm install
cp .env.example .env.local     # rồi điền các giá trị
npm run dev
```

```bash
npm run build        # build production
npm run typecheck    # tsc --noEmit
npm run lint
```

> **Nếu shell của bạn có sẵn `NODE_ENV=production`**, `next dev` sẽ chết ở middleware với
> `EvalError: Code generation from strings disallowed`. Chạy
> `NODE_ENV=development npx next dev` để tránh.

Dự án **build được mà không cần Supabase**. Khi thiếu biến môi trường, các trang
công khai render với nội dung rỗng thay vì lỗi — hữu ích khi mới clone về.

## Cơ sở dữ liệu

Schema nằm ở `supabase/migrations/`. Các bảng chính: `profiles`, `posts`, `comments`,
`messages` (tin liên hệ / góp ý / báo lỗi), cùng `comment_rate_limit` — dùng chung
cho cả bình luận lẫn tin nhắn, phân biệt bằng cột `scope`.

### Chạy local

```bash
npx supabase start      # cần Docker
npx supabase db reset   # áp migration
```

`supabase start` in ra `Project URL` và hai khoá — điền vào `.env.local`.

### Tạo tài khoản quản trị đầu tiên

Đăng ký tài khoản Supabase là chuyện ai cũng làm được — **có tài khoản không có nghĩa là
nhân sự**. Mỗi profile mới được tạo ở trạng thái `is_active = false` và không đụng được
gì trong CMS cho tới khi một admin kích hoạt. Đây là điều `is_staff()` kiểm tra, và mọi
policy của `posts` / `comments` / storage đều đi qua nó.

Bước 1 — tạo user:

```bash
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"...","email_confirm":true,
       "user_metadata":{"display_name":"Tên của bạn"}}'
```

Bước 2 — kích hoạt (chạy trên SQL editor của Supabase, hoặc `psql` khi chạy local):

```sql
update public.profiles
   set role = 'admin', is_active = true
 where id = (select id from auth.users where email = 'you@example.com');
```

Sau đó đăng nhập ở `/admin/dang-nhap`. Ai đăng nhập mà chưa được kích hoạt sẽ thấy thông báo chờ cấp
quyền thay vì vào được trang quản trị.

Hai bước trên chỉ cần cho **tài khoản quản trị đầu tiên** (người tạo nó phải làm bằng tay). Từ đó về sau,
thêm người ngay trong `/admin/nguoi-dung`: nhập email, chọn vai trò, hệ thống tạo tài khoản với mật khẩu tạm
hiện **một lần** để bạn gửi cho họ, và bật/tắt hay đổi vai trò bất cứ lúc nào. Không ai tự đổi quyền của
chính mình — nhờ một quản trị viên khác.

> Nên tắt luôn tự đăng ký trong Supabase Dashboard (*Authentication → Sign In / Providers
> → Allow new users to sign up*) như một lớp phòng thủ thứ hai. Lớp thứ nhất vẫn là
> `is_active`, vì toggle trên dashboard rất dễ bị bật lại.

### Lên production

**Thứ tự dưới đây bắt buộc, không được đảo:**

1. **Sao lưu** cơ sở dữ liệu (`pg_dump` hoặc bản sao lưu tương đương) trước khi
   đụng vào production.
2. **Kiểm ở local trước**, trên một DB dùng bỏ (không phải production):

   ```bash
   npx supabase db reset          # áp toàn bộ migration từ đầu vào DB local
   ./scripts/verify-security.sh   # phải xanh hết (58/58) trước khi đi tiếp
   ```

3. **Chạy migration trên production**, trước khi merge/deploy code này — code
   mới của DA1 select thẳng cột `posts.difficulty`, cột này chỉ tồn tại sau khi
   migration chạy; deploy code trước khi migrate nghĩa là mọi danh sách bài trả
   về rỗng và mọi trang bài viết 404 cho tới khi migration chạy xong:

   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```

   Toàn bộ migration theo thứ tự áp dụng:

   - `20260912000000_init.sql` — schema gốc (`profiles`, `posts`, `comments`)
   - `20260913000000_harden_access.sql` — vá bảo mật: `is_active` mặc định
     `false`, ẩn `comments.author_email`, bảng `comment_rate_limit` (cột
     `scope`, khoá giao dịch, hàm `consume_rate_limit(p_scope, …)`) — dùng
     chung cho bình luận và tin nhắn ngay từ đầu
   - `20260928000000_video_kind.sql`, `20260928000100_video_difficulty.sql` —
     loại bài Video và ràng buộc độ khó theo loại bài
   - `20260928000200_search.sql` — `plain_text`, `search_vector`, hàm `search_posts`
   - `20260928000300_messages.sql` — bảng `messages` cho `/admin/tin-nhan`,
     dùng lại `comment_rate_limit` (scope `'message'`) đã có sẵn từ migration
     bảo mật ở trên
   - `20260928000400_updated_at_ignores_search_text.sql` — cập nhật chỉ mục
     tìm kiếm không còn tính là sửa bài (`updated_at` giữ nguyên)
   - `20260928000500_channel_name_only_on_videos.sql` — ràng buộc `channel_name`
     (đã giới hạn 120 ký tự từ migration trước) chỉ được điền trên bài Video
4. **Deploy code** (merge nhánh này, để Vercel build và lên bản mới).
5. Vào `/admin` và bấm **"Cập nhật chỉ mục tìm kiếm"** một lần để điền
   `plain_text` cho các bài đã có từ trước — từ đó về sau `savePost` tự giữ nó
   cập nhật.
6. Trước khi đăng lại (republish) bất kỳ bài học/video nào có từ trước DA1,
   vào `/admin/bai-viet/[id]` và **đặt độ khó** cho bài đó qua bảng "Chủ đề &
   độ khó" — publishing giờ đòi độ khó cho `kind = lesson` và `kind = video`,
   và các bài cũ chưa có giá trị này (`difficulty = null`).
7. **Tắt tự đăng ký** trong Supabase Dashboard (*Authentication → Sign In /
   Providers → Allow new users to sign up*) và **kích hoạt tài khoản admin**
   thật (xem SQL ở mục "Tạo tài khoản quản trị đầu tiên" phía trên) — lớp
   phòng thủ thứ hai, lớp thứ nhất vẫn là `is_active`.
8. **Quyết định về HSTS preload.** `next.config.mjs` gửi header
   `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   khi build production — `preload` đưa domain vào danh sách preload cứng của
   trình duyệt, gần như không thể gỡ nhanh nếu cần quay lại HTTP. Xác nhận
   domain đã chạy HTTPS ổn định trước khi để nguyên; bỏ `preload` nếu chưa chắc.

Rồi điền biến môi trường trên Vercel. **Không** commit `SUPABASE_SERVICE_ROLE_KEY`
— khoá này bỏ qua toàn bộ RLS.

### Biến môi trường

| Biến | Dùng để làm gì |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase (public, lộ ra trình duyệt). Bắt buộc để kết nối cơ sở dữ liệu. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khoá anon Supabase (public). Dùng cho mọi truy vấn phía client/server chạy dưới quyền RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Khoá service role, bỏ qua RLS. Chỉ dùng ở server (route handler, Server Action, `rate-limit.ts`) — **không bao giờ** có tiền tố `NEXT_PUBLIC_`, không commit. |
| `NEXT_PUBLIC_SITE_URL` | Domain gốc dùng cho metadata, sitemap, robots.txt, ảnh OG. Inline lúc build; không đọc được sau khi deploy. Bỏ trống thì rơi về `https://projectchipchip.org` (`src/lib/site.ts`). |
| `COMMENT_IP_SALT` | Muối băm IP cho rate limit bình luận/tin nhắn. Mặc định lấy tạm từ service role key — đặt riêng để xoay service key không làm mất hết bộ đếm. |
| `TRUSTED_PROXY_HOPS` | Số proxy đứng trước app, mặc định `1`. Vercel hoặc một nginx thì để `1`; thêm CDN ở ngoài thì `2`. Đọc sai số này là rate limit bị bypass. |
| `DEEPSEEK_API_KEY` | Bật nút "Dịch nháp bằng AI" ở tab EN của trình soạn bài. Không có thì nút tắt kèm lời giải thích. Chỉ đặt ở server. |
| `DEEPSEEK_MODEL` | Model DeepSeek dùng để dịch nháp, mặc định `deepseek-v4-pro`; đổi sang ví dụ `deepseek-flash` nếu muốn rẻ và nhanh hơn. |

`.env.example` chưa có hai biến DeepSeek và chưa chắc đã khớp danh sách trên —
chủ dự án tự đối chiếu và cập nhật (công cụ tự động không đọc được file này
trong môi trường này).

DA2 (công cụ viết bài) **không có migration mới**: chỉ cần deploy code; đặt `DEEPSEEK_API_KEY` nếu muốn dùng dịch nháp.

DA3 (bài học, video, tìm kiếm) cũng **không có migration mới**. Tab `?tab=video` cũ của trang Bài học chuyển hẳn (308) sang `/vi/video`.

DA4 (trang uy tín, blog) **không có migration mới**: form Liên hệ và "Báo lỗi bài này" dùng `/api/messages` và bảng `messages` có sẵn, chung giới hạn 3 tin mỗi giờ cho mỗi IP (đã băm).

### Dịch nháp bằng AI và quyền riêng tư

Nút "Dịch nháp bằng AI" gửi **nội dung bài viết** (tiêu đề, tóm tắt, chữ trong thân bài, chú thích và mô tả ảnh) tới máy chủ của DeepSeek (`api.deepseek.com`) để dịch. Dòng "Được góp ý bởi …" không bao giờ rời server — tên người góp ý là danh từ riêng nên được giữ nguyên, không dịch. Không gửi email, bình luận, tin nhắn hay bất kỳ dữ liệu nào của người đọc; công thức, khối mã và địa chỉ link không rời server. Bản dịch chỉ được nạp vào tab EN như thay đổi chưa lưu — không có gì được ghi vào cơ sở dữ liệu cho tới khi người viết đọc lại và bấm "Lưu". Mỗi lần bấm gửi tối đa 60 000 ký tự.

## Cấu trúc

```
src/
├── app/
│   ├── [locale]/          # site công khai, có tiền tố ngôn ngữ
│   │   ├── page.tsx               Trang chủ
│   │   ├── bai-hoc/               Bài học → [topic] → [slug]
│   │   ├── video/                 Video → [slug]
│   │   ├── tim-kiem/              Kết quả tìm kiếm (noindex)
│   │   ├── blog/                  Blog → [slug]
│   │   ├── gioi-thieu/            Giới thiệu (tác giả, cam kết, FAQ)
│   │   ├── lien-he/               Liên hệ (form gửi /api/messages)
│   │   ├── dong-gop/              Đóng góp
│   │   └── chinh-sach-bao-mat/    Chính sách bảo mật
│   ├── admin/             # CMS, tiếng Việt, không có tiền tố ngôn ngữ
│   │   ├── (auth)/dang-nhap/      Đăng nhập
│   │   └── (dashboard)/           Tổng quan · Bài viết · Bình luận · Tin nhắn
│   ├── api/comments/      # nhận bình luận (rate limit, honeypot)
│   ├── api/messages/      # nhận tin liên hệ / góp ý (rate limit, honeypot)
│   ├── opengraph-image.tsx ở mỗi nhánh có trang riêng
│   ├── sitemap.ts · robots.ts
│   └── globals.css
├── i18n/                  # routing, navigation, request config
├── messages/{vi,en}.json  # toàn bộ copy của giao diện
├── assets/fonts/        # TTF cho ảnh OG (satori không đọc được woff2)
├── lib/
│   ├── supabase/          # client, server, admin (service role), upload, config
│   ├── og/                # font + card dùng chung cho ảnh chia sẻ
│   ├── tiptap/            # extensions, render HTML, mục lục heading
│   ├── queries/posts.ts   # truy vấn đọc
│   ├── auth.ts            # requireStaff()
│   ├── constants.ts       # dữ liệu không dịch
│   ├── paths.ts           # postHref: URL của mọi loại bài (thẻ, tìm kiếm, sitemap, cache)
│   ├── listing-params.ts · listing-order.ts · search-query.ts  # tham số URL, sắp xếp
│   ├── post-slug.ts · seo.ts · types.ts · utils.ts
├── components/
│   ├── layout/            Navbar, Footer, Logo, LangSwitch, SocialLinks
│   ├── sections/          các section trang chủ + trang nội dung
│   ├── forum/             PostCard, ExpandingCardLink, ArticleBody, CommentSection
│   ├── contact/           MessageForm, ReportMistake ("Báo lỗi bài này")
│   ├── lessons/           LessonsListing, TopicSidebar (trang Bài học + chủ đề)
│   ├── video/             VideoCard, VideoFilters
│   ├── listing/           FilterPills, Pagination (dùng chung)
│   ├── search/            SearchForm, SearchBox
│   ├── admin/             PostEditor, EditorToolbar, AdminNav, …
│   ├── ui/                PillButton, AutoplayVideo, GlassPill, StarBorder, …
│   └── motion/            tokens, variants, AnimatedSection, ScrollReveal3D,
│                           StickyBackdrop, TiltCard, VideoHoverCard, useVideoHoverCard, …
└── middleware.ts          next-intl + phiên Supabase + chặn /admin
```

## Ngôn ngữ

`next-intl`, hai locale `vi` (mặc định) và `en`. URL được bản địa hoá:

| Tiếng Việt        | English        |
| ----------------- | -------------- |
| `/vi/bai-hoc`     | `/en/lessons`  |
| `/vi/video`       | `/en/videos`   |
| `/vi/tim-kiem`    | `/en/search`   |
| `/vi/blog`        | `/en/blog`     |
| `/vi/gioi-thieu`  | `/en/about`    |
| `/vi/lien-he`     | `/en/contact`  |
| `/vi/dong-gop`    | `/en/contribute` |
| `/vi/chinh-sach-bao-mat` | `/en/privacy` |
| `/vi/dang-ky`     | `/en/sign-up`  |
| `/vi/dang-ky/tinh-nguyen` | `/en/sign-up/volunteer` |
| `/vi/dang-ky/khao-sat` | `/en/sign-up/survey` |
| `/vi/dang-ky/webinar` | `/en/sign-up/webinar` |
| `/vi/dang-ky/cuoc-thi` | `/en/sign-up/competition` |
| `/vi/bao-chi`     | `/en/press`    |

Khai báo ở `src/i18n/routing.ts`. Slug bài viết **không** bản địa hoá — mỗi bản dịch
có slug riêng trong database.

Đăng ký tách **mỗi loại một trang**; danh sách loại và đường dẫn nằm ở
`src/components/signup/signup-kind.ts` (`SIGNUP_TYPES`, `SIGNUP_TYPE_PATHS`), còn `/dang-ky` là
trang giới thiệu bốn lựa chọn.

**Font:** Be Vietnam Pro + JetBrains Mono, cả hai đều có subset `vietnamese`.
Không đổi sang font thiếu subset này — chữ có dấu sẽ rớt về font hệ thống.

## Quy tắc nội dung

**Mọi bài viết bắt buộc có đủ bản Việt và Anh.** Đây không phải quy ước ở tầng giao
diện mà là ràng buộc ở database: `publish_translation()` từ chối đăng nếu nhóm dịch
chưa đủ hai ngôn ngữ, hoặc bản nào còn thiếu tiêu đề/nội dung. Nhờ vậy không có cách
nào đăng lệch một nửa.

**Bình luận** đi qua `/api/comments`, không ghi trực tiếp từ trình duyệt. Route handler
mới là nơi kiểm tra dữ liệu, chặn bot bằng honeypot, giới hạn 3 bình luận / 10 phút
theo IP (đã băm), và đánh dấu `is_post_author` khi ban điều hành trả lời.
`author_email` không bao giờ được trả về cho client — chỉ hiện trong `/admin/comments`.

**Nội dung bài viết** lưu dạng Tiptap JSON, render sang HTML ở server qua
`generateHTML` rồi cho qua bộ lọc allow-list không cần DOM
(`src/lib/tiptap/sanitize.ts`). Công thức (KaTeX) và khung video được dựng
**sau** bước lọc, chỉ từ dữ liệu đã kiểm tra: chuỗi LaTeX lấy thẳng từ JSON và
ID video khớp regex của nền tảng. Không lưu HTML thô. Video chỉ tải player
YouTube/TikTok khi người đọc bấm vào.

**Các khối soạn bài** (toolbar ở `/admin/bai-viet/[id]`):

- **Công thức** — nút √ (trong dòng) hoặc Σ (khối), gõ LaTeX vào hộp thoại; hiện dạng KaTeX ngay trong trình soạn.
- **Ảnh / Hình có chú thích** — nút ảnh+ để chèn ảnh trần, nút ảnh để chèn hình có `alt` và chú thích, đánh số "Hình 1.", "Hình 2." tự động khi có chú thích.
- **Callout** — menu thả xuống 4 loại: Ghi chú, Mẹo, Lưu ý, Ví dụ.
- **Nguồn tham khảo** — nút Nguồn tham khảo chèn khối danh sách có số thứ tự; nút Người góp ý (chỉ hiện khi đã có khối này) đặt dòng "Được góp ý bởi …".
- **Video** — nút Video, dán link YouTube hoặc TikTok; hiện lại thumbnail trong trình soạn, còn trang công khai dựng facade bấm-để-phát.

## Ảnh chia sẻ (Open Graph)

Mỗi trang có ảnh 1200×630 dựng động bằng `next/og`, nền gradient thương hiệu kèm
tiêu đề bài. Ảnh mặc định nằm ở `src/app/[locale]/opengraph-image.tsx` — **trong
`[locale]`, không phải ở gốc `app/`**, vì route ở gốc không thấy được ngôn ngữ
đang xem và sẽ luôn render bản tiếng Việt.

Font là TTF chứ không phải woff2: satori không đọc được woff2. Hai file nằm ở
`src/assets/fonts/` và được khai báo trong `outputFileTracingIncludes` của
`next.config.mjs` — thiếu dòng đó thì ảnh chạy ở máy nhưng 404 trên Vercel.

## Việc còn lại

### Nội dung cần thay trước khi ra mắt

DA4 dựng các trang uy tín bằng câu chữ mẫu. Chỗ nào là mẫu thì câu chữ tự ghi
trong ngoặc vuông, ví dụ "[Tên tác giả]". DA5 thay theo danh sách này
(khoá message có ở **cả** `src/messages/vi.json` và `en.json`):

| Nơi | Khoá / hằng số | Cần gì |
| --- | --- | --- |
| Messages | `about.author.name`, `about.author.role`, `about.author.photoAlt` | Tên, vai trò thật của tác giả |
| Messages | `about.author.story1`, `about.author.story2` | Câu chuyện thật, 2 đoạn |
| Messages | `about.faq.items.*` (6 câu: `free`, `author`, `mistake`, `classroom`, `ads`, `english`) | **Câu mẫu** — duyệt lại từng câu, nhất là `classroom` (điều kiện dùng bài cho lớp học) |
| Messages | `contact.aside.responseBody` | Thời gian phản hồi thật |
| Messages | `contribute.*` | Duyệt lại bốn cách đóng góp cho khớp cách làm thật |
| `src/lib/constants.ts` | `AUTHOR.photo` | Đường dẫn ảnh trong `public/`; `null` thì hiện chữ cái đầu |
| `src/lib/constants.ts` | `CONTRIBUTORS` | `{ name, role, photo }[]`; rỗng thì mục "Đội ngũ" ẩn; `photo` là đường dẫn trong `public/` hoặc `null` (hiện chữ cái đầu) |
| `src/lib/constants.ts` | `CONTACT_EMAIL` | Email liên hệ; rỗng thì ẩn ở trang Liên hệ và khối cuối trang chủ |
| `src/lib/constants.ts` | `SOCIAL_LINKS` | URL Facebook, TikTok; rỗng thì ẩn |
| `src/lib/constants.ts` | `PRIVACY_UPDATED` | Đổi khi sửa chính sách bảo mật |
| `public/video/hero-intro.mp4`, `src/lib/constants.ts` | `HOME_VIDEO` | Clip mở trang chủ (29s đầu của "The Closest Thing We Have to Alien Technology"). Đã có; cần xin phép hoặc giữ dòng ghi nguồn `HOME_VIDEO_CREDIT` |
| `public/video/*.mp4`, `src/lib/constants.ts` | `CAROUSEL_VIDEOS` | 6 clip carousel trang chủ — giữ chỗ, cùng nguồn |
| `public/video/asml-part1..4.mp4`, `src/lib/constants.ts` | `TOPIC_VIDEOS` | 4 clip 30s của video ASML "Computational lithography" cạnh accordion trang chủ. Đã có; cần ghi nguồn/xin phép |
| `src/lib/constants.ts` | `ABOUT_BANNER`, `VIDEO_BANNER` | Ảnh Siltronic cạnh tiêu đề trang Giới thiệu và ảnh nền trang Video — cần xác nhận quyền dùng ảnh |
| `src/lib/constants.ts` | `BLOG_CLIP`, `BLOG_CLIP_CREDIT` | Clip nền và dòng ghi nguồn đầu trang Blog (18s đầu video TSMC) |
| `src/lib/country-clips.ts` | `COUNTRY_CLIPS` | Đoạn YouTube (id, start, end) cho 5 nước — nhúng, không tải file |
| `src/lib/constants.ts` | `CTA_BACKDROP` | Ảnh nền khối CTA cuối trang chủ — hiện là nền tối vẽ giữ chỗ |
| `src/lib/constants.ts` | `HOME_VIDEO_CREDIT` | `{ label, href } \| null` — dòng ghi nguồn dưới video mở trang chủ; `null` thì ẩn |
| `src/lib/constants.ts`, `public/logos/` | `COUNTRY_BANDS[].companies[]` | Logo và website từng công ty. Thiếu logo **Micron** (`logo: null`, hiện tên chữ); logo ASML có watermark "cleanpng" mờ, nên thay bản sạch |
| `src/components/layout/Logo.tsx` | logo | Chữ dạng wordmark giữ chỗ — thay bằng logo vector thật |
| Biến môi trường | `NEXT_PUBLIC_SITE_URL` | Domain thật khi lên production — biến này được inline lúc build (xem mục Biến môi trường bên dưới), không đọc được sau khi deploy; fallback nếu bỏ trống là `https://projectchipchip.org` (`src/lib/site.ts`) |
| Cơ sở dữ liệu production | — | Xoá bài test/demo còn sót lại và các dòng trùng lặp trước khi công khai — các đợt DA1–DA4 để lại dữ liệu nghiệm thu trên stack local (đã dọn ở đó), nhưng phải kiểm tra riêng trên DB production trước khi ra mắt |

Trang Chính sách bảo mật (`privacy.*`) mô tả đúng cách code chạy ngày
2026-09-28 (bảng `comments`, `messages`, `comment_rate_limit`, cookie
`NEXT_LOCALE`, dịch nháp DeepSeek). Đổi cách thu hoặc lưu dữ liệu thì sửa
trang này cùng lúc.

### Đang chờ dữ liệu

Điền vào `src/lib/constants.ts`:

| Hằng số             | Cần gì                                        |
| ------------------- | --------------------------------------------- |
| `SOCIAL_LINKS`      | URL fanpage Facebook và TikTok                |

- `CAROUSEL_VIDEOS` (6 clip carousel trang chủ) vẫn là video giữ chỗ mượn từ
  dự án Strike Robot (`public/video/clip-1..6.mp4`), nội dung không liên quan
  bán dẫn — phải thay hết trước khi lên production.

Ngoài ra: logo vector bản trong suốt, logo Micron, ảnh đội ngũ — và **nội dung
bài học**, hiện là phần thiếu lớn nhất.

### Chưa làm

- Chưa có trang riêng cho từng quốc gia hay từng công ty: logo công ty đang link
  ra website chính thức (tab mới)

### Giới hạn đã biết

- **404 render phía client trước khi hydrate xong.** Next 14 (App Router) stream
  phần khung trang trước rồi mới đẩy nội dung `not-found` qua RSC — mã trạng thái
  HTTP luôn đúng (404), nhưng HTML thô ban đầu là khung chung của Next chứ chưa
  phải layout thật; nội dung thật chỉ xuất hiện sau khi React hydrate ở trình
  duyệt. Cần nâng cấp qua khỏi dòng Next 14 mới sửa triệt để.
- **Mọi trang công khai render theo từng request**, không cache tĩnh — Supabase
  server client đọc cookie (phiên đăng nhập) trên mọi trang nên không route nào
  được prerender. Lưu lượng lúc ra mắt còn nhỏ nên chưa cần xử lý; cải thiện
  bằng một client Supabase không đọc cookie cho các trang thuần đọc, để dành
  sau ra mắt.
