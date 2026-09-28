# Bàn giao — Project Chíp Chíp

Cập nhật: 29/09/2026 · Nhánh: `feat/da5-hoan-thien`

---

## 1. Trạng thái cây làm việc

`feat/da5-hoan-thien` đứng trên `main` cục bộ (main ahead of `origin/main` 86
commit — **chưa có gì được push lên GitHub**, toàn bộ DA1–DA5 vẫn nằm ở máy
local). Nhánh này thêm 14 commit lên trên `main` cục bộ: 13 commit sửa lỗi/độ
hoàn thiện của đợt DA5 (CSP, ẩn `/motion-gallery` ở production, 404 hoá URL lạ,
hreflang trung thực, giới hạn kích thước request, a11y, SEO rẻ tiền, tách
service-role key khỏi bundle client) cộng commit cập nhật tài liệu này.

Cây làm việc sạch — không có gì sửa dở ngoài các file `.claude/`,
`.commandcode/`, `.crossweave/` (rác công cụ, không phải của dự án).

---

## 2. Đã có gì (DA1–DA5)

**DA1 — Nền dữ liệu.** Migration cho loại bài Video, độ khó (3 mức, bắt buộc
với `lesson`/`video`), tìm kiếm không dấu (`plain_text`, `search_vector`, hàm
`search_posts`), bảng `messages` cho hộp thư liên hệ/góp ý/báo lỗi, và đổi tên
Diễn đàn → Blog (redirect 301 giữ query). Mọi dự án con sau đứng trên nền này.

**DA2 — Công cụ viết bài.** Các node Tiptap mới trong trình soạn:
công thức (KaTeX, inline + khối), Hình có chú thích đánh số tự động, Callout
4 loại, Nguồn tham khảo + người góp ý, nhúng Video (YouTube/TikTok, facade
bấm-để-phát). Nút "Dịch nháp bằng AI" gọi DeepSeek từ server, giữ nguyên cấu
trúc Tiptap/công thức/hình, không tự ghi đè bản EN đã có nội dung.

**DA3 — Bài học, Video, Tìm kiếm (giao diện công khai).** Trang Bài học với
cột chủ đề thu/giãn + lưới thẻ; trang Video với bộ lọc nguồn/độ khó và sắp xếp
Mới/Cũ/Đơn giản/Phức tạp; ô tìm kiếm toàn site trên navbar, trang kết quả
render ở server, gõ không dấu vẫn ra kết quả có dấu.

**DA4 — Uy tín và Blog.** Trang Giới thiệu (Về tác giả, mục đích minh bạch,
FAQ, "Những người đã đồng hành"), Liên hệ/Góp ý và Đóng góp, Chính sách bảo
mật, nút "Báo lỗi bài này" trên mỗi bài, thẻ Blog nở tại chỗ khi bấm trước khi
chuyển trang.

**DA5 — Hoàn thiện trước ra mắt.** Đợt rà soát (audit) không tìm thấy lỗi
chặn ra mắt ở tầng code; các việc mở ra từ audit đã sửa: CSP chỉ cho phép
`unsafe-eval` ở dev, ẩn `/motion-gallery` ở production, 404 hoá URL không
khớp route nào, hreflang không trỏ vào bản dịch không tồn tại, `LangSwitch`
sau `Suspense`, giới hạn kích thước request (413, cả khi client stream/chunk
để né header `content-length`), sửa vài điểm a11y, vài cải thiện SEO rẻ tiền
(404 quá trang cuối, bỏ `host:` phi chuẩn khỏi `robots.ts`), và tách
`SUPABASE_SERVICE_ROLE_KEY` ra khỏi file mà client component import được.
Một hạng mục (client Supabase không đọc cookie để cache được) chủ động để lại
cho sau ra mắt — xem mục 7.

---

## 3. Chạy local

```bash
npx supabase start                    # cần Docker
NODE_ENV=development npx next dev     # xem bẫy NODE_ENV bên dưới
```

**Bẫy môi trường:** nếu shell có sẵn `NODE_ENV=production`, `next dev` chết ở
middleware với `EvalError: Code generation from strings disallowed`. Luôn chạy
`NODE_ENV=development npx next dev`.

**Bẫy nghiêm trọng hơn:** đừng chạy `next build` trong khi `next start` (hay
`next dev`) đang phục vụ cùng thư mục — build ghi đè `.next` giữa chừng và
trang vỡ với *"Application error: a client-side exception"*, trông như lỗi
code nhưng không phải. Dừng server đang chạy trước khi build.

`supabase start` in ra `Project URL` và hai khoá — điền vào `.env.local`
(xem README, mục "Biến môi trường", để biết đủ danh sách biến).

### Tạo tài khoản admin local

Làm theo đúng SQL ở README, mục **"Tạo tài khoản quản trị đầu tiên"** — tạo
user qua Admin API rồi kích hoạt bằng UPDATE trực tiếp trên `profiles`. File
bàn giao trước đây (bản 14/09) có ghi sẵn một email/mật khẩu mẫu ở đây; đã bỏ
khỏi bản này vì đó là thông tin đăng nhập thật bị commit nhầm vào tài liệu —
đừng khôi phục lại kiểu đó, luôn tự tạo tài khoản mới bằng SQL.

---

## 4. Kiểm chứng — lệnh và con số hiện tại

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm test -- --maxWorkers=3
npm run build
```

Tại thời điểm viết tài liệu này: `npm test` → **33 file, 354 test, tất cả
pass**. `npm run lint` sạch, không cảnh báo.

```bash
./scripts/verify-security.sh
```

Diễn lại các cuộc tấn công mà migration `20260913000000_harden_access.sql` và
các ràng buộc dữ liệu về sau chặn lại — cần một stack Supabase local đang chạy
(`npx supabase start`), **không bao giờ chạy nhắm vào production**. Hiện có
**32 kiểm tra**, tất cả phải xanh (32/32) trước khi lên production.

---

## 5. Trước khi lên production

Danh sách đầy đủ, đúng thứ tự, nằm ở README — mục **"Lên production"**: sao
lưu → kiểm ở local trên DB dùng bỏ + `verify-security.sh` xanh hết → chạy
migration trên production → deploy code → bấm "Cập nhật chỉ mục tìm kiếm" →
đặt độ khó cho bài học/video có từ trước DA1 rồi mới đăng lại → tắt tự đăng ký
trong Supabase Dashboard + kích hoạt tài khoản admin thật → quyết định giữ hay
bỏ `preload` trong header HSTS.

---

## 6. Nội dung chủ dự án cần điền

Danh sách đầy đủ (khoá message, hằng số trong `src/lib/constants.ts`, biến môi
trường, dữ liệu production) nằm ở README, mục **"Nội dung cần thay trước khi
ra mắt"**. Tóm tắt những nhóm lớn nhất: câu chuyện/ảnh tác giả thật, duyệt lại
6 câu FAQ mẫu, 7 video giữ chỗ (mượn từ dự án Strike Robot, nội dung không
liên quan bán dẫn), logo + mascot dạng vector nền trong suốt, logo 10 công ty
theo từng nước, và **nội dung bài học thật** — phần thiếu lớn nhất, hiện trang
Bài học chỉ là khung rỗng nếu không có bài.

---

## 7. Việc còn để lại — nhóm theo mức khẩn

### Trước khi ra mắt

- Toàn bộ nội dung ở mục 6 (README có danh sách đầy đủ).
- Dọn dữ liệu production: bài test/demo còn sót và các dòng trùng lặp. Các
  đợt DA1–DA4 đều để lại dữ liệu nghiệm thu (tài khoản tạm, bài test) trên
  stack **local** và đã tự dọn ở đó (xem ghi chú "Cleanup" trong từng ledger
  dưới `.superpowers/sdd/`) — production là một cơ sở dữ liệu khác, phải kiểm
  tra riêng, không thể giả định đã sạch.
- Quyết định về `preload` trong header HSTS (mục 5) — gần như không thể gỡ
  nhanh sau khi domain vào danh sách preload cứng của trình duyệt.

### Có thể để sau ra mắt

- **Client Supabase không đọc cookie cho các trang thuần đọc.** Hiện mọi
  trang công khai render theo từng request vì client server-side đọc cookie
  phiên đăng nhập trên mọi trang, nên không trang nào được prerender/cache
  tĩnh. Audit DA5 chủ động để hạng mục này lại — lưu lượng lúc ra mắt còn nhỏ,
  chưa đáng chi phí đổi kiến trúc client.
- **404 của Next 14 còn hiện khung chung trước khi hydrate.** Mã trạng thái
  HTTP luôn đúng (404), nhưng HTML thô ban đầu của trang chi tiết bài
  học/video/blog không tồn tại là khung mặc định của Next chứ chưa phải layout
  thật — nội dung thật chỉ vào DOM sau khi React hydrate. Đây là giới hạn của
  dòng Next 14 (App Router stream khung trước khi `notFound()` trong Server
  Component kịp chạy); cần nâng cấp qua khỏi Next 14 mới sửa triệt để. Chi
  tiết điều tra: `.superpowers/sdd/2026-09-29-da5-hoan-thien/code-wave-report.md`,
  mục 4.
- Một số việc "minor (deferred)" cosmetic để lại rải rác trong các ledger
  DA1–DA4 (`.superpowers/sdd/2026-09-28-da{1..4}-*/progress.md`) — không ảnh
  hưởng chức năng, ví dụ: tên kênh video dài không được cắt gọn trong thẻ,
  hộp tìm kiếm trên di động không tự focus, `rebuildSearchText` chạy tuần tự
  từng dòng (ổn ở quy mô hiện tại). Không có cái nào chặn ra mắt.
- Trang riêng cho từng quốc gia và bản đồ silhouette các nước — nằm ngoài
  phạm vi đã chốt ở roadmap (`docs/superpowers/specs/2026-09-28-lo-trinh-nang-cap-design.md`).

---

## 8. Quy trình đang dùng

Spec → plan → thực thi bằng subagent (subagent-driven development), mỗi task
một subagent mới cộng một vòng review. DA1–DA4 theo đúng vòng này với spec và
plan riêng dưới `docs/superpowers/specs/` và `docs/superpowers/plans/`. DA5
chạy tinh gọn hơn — không có spec/plan file, là một đợt rà soát có giới hạn
(audit → hai đợt sửa: code rồi docs, mỗi đợt kèm review) vì phạm vi đã được
đợt audit đóng khung sẵn.

Sổ tiến độ (ledger) của từng đợt nằm ở `.superpowers/sdd/<tên-plan>/progress.md`
— đây là **scratch cá nhân, bị `.gitignore` chặn**, không thuộc lịch sử commit
và không đi kèm khi bàn giao mã nguồn. Đọc chúng để hiểu quyết định đã đưa ra
và vì sao, nhưng đừng coi ô checkbox trong các file plan là thước đo tiến độ —
lịch sử commit mới là bản ghi thật.
