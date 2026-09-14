# Project Chíp Chíp — Website

Website cộng đồng học tập bán dẫn phi lợi nhuận cho học sinh trung học phổ thông.
Song ngữ Việt / Anh, gồm 4 mục công khai — **Trang chủ · Bài học · Diễn đàn · Giới thiệu** — và một trang quản trị để ban điều hành soạn bài, duyệt bình luận.

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

Schema nằm ở `supabase/migrations/`. Ba bảng chính: `profiles`, `posts`, `comments`,
cùng `comment_rate_limit` cho việc chống spam.

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

Sau đó đăng nhập ở `/admin/dang-nhap`. Thêm người về sau thì lặp lại 2 bước trên với
`role = 'editor'`. Ai đăng nhập mà chưa được kích hoạt sẽ thấy thông báo chờ cấp quyền
thay vì vào được trang quản trị.

> Nên tắt luôn tự đăng ký trong Supabase Dashboard (*Authentication → Sign In / Providers
> → Allow new users to sign up*) như một lớp phòng thủ thứ hai. Lớp thứ nhất vẫn là
> `is_active`, vì toggle trên dashboard rất dễ bị bật lại.

### Lên production

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Rồi điền biến môi trường trên Vercel (xem `.env.example`). **Không** commit
`SUPABASE_SERVICE_ROLE_KEY` — khoá này bỏ qua toàn bộ RLS.

Hai biến tuỳ chọn, nên đặt khi lên production:

| Biến | Mặc định | Dùng để làm gì |
|---|---|---|
| `COMMENT_IP_SALT` | lấy tạm từ service role key | Muối băm IP cho rate limit. Đặt riêng để xoay service key không làm mất hết bộ đếm. |
| `TRUSTED_PROXY_HOPS` | `1` | Số proxy đứng trước app. Vercel hoặc một nginx thì để `1`; thêm CDN ở ngoài thì `2`. Đọc sai số này là rate limit bị bypass. |

## Cấu trúc

```
src/
├── app/
│   ├── [locale]/          # site công khai, có tiền tố ngôn ngữ
│   │   ├── page.tsx               Trang chủ
│   │   ├── bai-hoc/               Bài học → [topic] → [slug]
│   │   ├── dien-dan/              Diễn đàn → [slug]
│   │   └── gioi-thieu/            Giới thiệu
│   ├── admin/             # CMS, tiếng Việt, không có tiền tố ngôn ngữ
│   │   ├── (auth)/dang-nhap/      Đăng nhập
│   │   └── (dashboard)/           Tổng quan · Bài viết · Bình luận
│   ├── api/comments/      # nhận bình luận (rate limit, honeypot)
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
│   ├── post-slug.ts · seo.ts · types.ts · utils.ts
├── components/
│   ├── layout/            Navbar, Footer, Logo, LangSwitch, SocialLinks
│   ├── sections/          các section trang chủ + trang nội dung
│   ├── forum/             PostCard, ArticleBody, CommentSection
│   ├── admin/             PostEditor, EditorToolbar, AdminNav, …
│   ├── ui/                PillButton, AutoplayVideo, GlassPill, StarBorder, …
│   └── animations/        framer-motion variants dùng chung
└── middleware.ts          next-intl + phiên Supabase + chặn /admin
```

## Ngôn ngữ

`next-intl`, hai locale `vi` (mặc định) và `en`. URL được bản địa hoá:

| Tiếng Việt        | English        |
| ----------------- | -------------- |
| `/vi/bai-hoc`     | `/en/lessons`  |
| `/vi/dien-dan`    | `/en/forum`    |
| `/vi/gioi-thieu`  | `/en/about`    |

Khai báo ở `src/i18n/routing.ts`. Slug bài viết **không** bản địa hoá — mỗi bản dịch
có slug riêng trong database.

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
`generateHTML` rồi cho qua DOMPurify với allow-list. Không lưu HTML thô.

## Ảnh chia sẻ (Open Graph)

Mỗi trang có ảnh 1200×630 dựng động bằng `next/og`, nền gradient thương hiệu kèm
tiêu đề bài. Ảnh mặc định nằm ở `src/app/[locale]/opengraph-image.tsx` — **trong
`[locale]`, không phải ở gốc `app/`**, vì route ở gốc không thấy được ngôn ngữ
đang xem và sẽ luôn render bản tiếng Việt.

Font là TTF chứ không phải woff2: satori không đọc được woff2. Hai file nằm ở
`src/assets/fonts/` và được khai báo trong `outputFileTracingIncludes` của
`next.config.mjs` — thiếu dòng đó thì ảnh chạy ở máy nhưng 404 trên Vercel.

## Việc còn lại

### Đang chờ dữ liệu

Điền vào `src/lib/constants.ts`:

| Hằng số             | Cần gì                                        |
| ------------------- | --------------------------------------------- |
| `SOCIAL_LINKS`      | URL fanpage Facebook và TikTok                |
| `JOIN_FORM_URL`     | Link Google Form đăng ký thành viên           |

- `public/video/*.mp4` là video giữ chỗ mượn từ dự án Strike Robot để xem
  hiệu ứng. Nội dung không liên quan bán dẫn — phải thay hết trước khi lên
  production. Điểm thay: `HOME_VIDEO` và `CAROUSEL_VIDEOS` trong
  `src/lib/constants.ts`.

Ngoài ra: logo vector bản trong suốt, bản đồ silhouette các nước, logo công ty,
ảnh đội ngũ — và **nội dung bài học**, hiện là phần thiếu lớn nhất.

### Chưa làm

- Tab Video trong `/bai-hoc` mới là trạng thái "đang hoàn thiện" — chờ video
- Mục quốc gia chưa có bản đồ silhouette, cờ và logo công ty — chờ asset
- Chưa có trang riêng cho từng quốc gia
- Chưa có tìm kiếm
- Chưa có test tự động trong repo

### Module đang chờ asset

Những file dưới đây đã viết xong nhưng chưa nối vào đâu, vì phụ thuộc clip 30s
hoặc ảnh tương tác. Không phải code thừa — nối vào khi asset tới:

`components/ui/HeroVideoCard.tsx`, `components/ui/ScrollVideoReveal.tsx`,
`components/animations/scrollVideoReveal.ts`, `hooks/useVideoHoverCard.ts`
