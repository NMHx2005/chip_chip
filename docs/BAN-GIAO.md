# Bàn giao — Project Chíp Chíp

Cập nhật: 01/10/2026 · Nhánh: `main` (cục bộ)

---

## 1. Trạng thái cây làm việc

Cây làm việc **sạch**, không có gì sửa dở. `main` đang **ahead of `origin/main` 72
commit** — **chưa có gì được push lên GitHub**, toàn bộ DA1–DA5 lẫn đợt thiết kế
lại giao diện vẫn nằm ở máy local. Đếm chính xác bằng
`git rev-list --count origin/main..main`.

Cách làm: mỗi bước dựng trên một nhánh riêng, xong thì merge `--ff-only` trở lại
`main` rồi xoá nhánh — nên `main` đi thẳng một mạch, không có merge commit. Xem
lịch sử bằng `git log --oneline -20`.

Ba thư mục rác công cụ nằm trong `.gitignore` (`.claude/`, `.commandcode/`,
`.crossweave/`) — không phải của dự án, đừng commit.

---

## 2. Đã có gì (DA1–DA5, và thiết kế lại giao diện bước 1–9)

Chín bước của đợt thiết kế lại giao diện đã xong (bước 1, 3, 4, 5a–5e, 6a–6d, 7,
8, 9); mỗi bước một plan ở `docs/superpowers/plans/2026-09-30-thiet-ke-lai-*` và
`2026-10-01-thiet-ke-lai-*`. Bản thiết kế gốc ở `docs/thiet-ke-giao-dien/` (đọc
`HANDOFF.md` trước).

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

**Đợt "Second fix" (docx kế hoạch).** Thay các phần giữ chỗ bằng nội dung thật:
hero có ảnh mạch điện làm mờ và clip 29s; 4 clip ASML cạnh accordion chủ đề;
sơ đồ Ecosystem (Equipment / Foundry / IDM / Fabless / OSAT) vẽ lại bằng code,
song ngữ; dải quốc gia mới gồm 5 nước (thêm Trung Quốc) với cờ chồng bản đồ,
logo công ty hiện khi hover/focus (luôn hiện trên cảm ứng) và bấm ra website
chính thức, mỗi nước một video YouTube nhúng có mốc start/end (bấm mới tải);
banner ảnh cho Giới thiệu và Video, clip TSMC làm nền trang Blog; giãn chữ logo.
Các clip tự host (~22 MB) đã nén 720p không tiếng; các video theo nước chỉ nhúng.

**Thiết kế lại giao diện — bước 1 (nền tảng).** Bản thiết kế ở
`docs/thiet-ke-giao-dien/` (đặc tả, đọc `HANDOFF.md` trước) được đưa vào mã theo
từng bước; kế hoạch bước 1 ở `docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-1-nen-tang.md`.
Đã có: token mới (màu ô nhập `field`, trạng thái nút, màu lỗi, cỡ chữ `h1`/`h2`,
easing `ease-standard`, thời lượng `fast`/`card`/`panel`) kèm test tương phản
trong `src/lib/design-tokens.test.ts`; `PageHero` v2 (thẻ số liệu, vào trang bằng
CSS `hero-in`, giảm chuyển động tắt hẳn animation); `Footer` liên kết 44px có
trạng thái trang hiện tại; thành phần mới `Button`, `Field`/`Input`/`Textarea`,
`FormNotice`, `RadioSegment`, `Disclosure` (chưa trang nào dùng, xem ở
`/ui-gallery`, chỉ có khi chạy dev). Quyết định đã chốt: viền ô nhập `#767676`;
thông báo thành công dùng màu nhấn + dấu tích (đỏ chỉ cho lỗi); Disclosure một
mẫu theo FAQ; màu lỗi theo bản vẽ Liên hệ; `PillButton` giữ nguyên cho trang chủ.
Còn lại theo `HANDOFF.md` mục "Thứ tự làm gợi ý": PostCard/phân trang/EmptyState
(bước 3), Bài học, Blog, Video, Tìm kiếm, Liên hệ, Giới thiệu, Đóng góp, Bảo mật,
404; khi đó mới xoá `.rise-in` và `EASE_SCROLL_REVEAL`.

**Thiết kế lại giao diện — bước 3 (thẻ, phân trang, trạng thái rỗng).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-3-the-va-phan-trang.md`.
Đã có: `PostCard` v2 thay tại chỗ (thẻ tự chuyển dạng gọn dưới 640px, `variant="row"`
cho kết quả tìm kiếm; áp dụng cho Bài học, Blog và khối "Từ Blog" ở trang chủ, giữ
`TiltCard` và `ExpandingCardLink`), `TopicChip` (số 1–4 + nhãn), `DifficultyMark`
(ba thanh + nhãn), `CardReveal` (hiện thẻ theo cột, trễ 0.05/0.12/0.19s),
`Pagination` v2 (mũi tên đầu/cuối mờ và không bấm được, dòng "Trang x trong y"),
`EmptyState`/`ErrorState` (khung nét đứt + hình chip), logic thuần trong
`src/lib/post-display.ts`. Xem thử ở `/ui-gallery` (chỉ dev). Chưa làm: tô từ
khoá ở dòng kết quả tìm kiếm (bước 6), gợi ý mức độ khác kèm số đếm khi lọc ra rỗng
(cần truy vấn đếm theo độ khó, đã hoãn theo quyết định của người bảo trì), Pagination
của Blog vẫn là bản riêng (bước 5).

**Thiết kế lại giao diện — bước 4 (trang Bài học).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-4-trang-bai-hoc.md`. `LessonsListing`
(dùng chung cho `/bai-hoc` và `/bai-hoc/[topic]`) được ráp lại: thẻ số liệu ba ô
(bài học, chủ đề, mức độ; trang chủ đề còn hai ô), `TopicNav` (cột chủ đề dạng thẻ có
vòng số và số đếm, thu gọn thành rail 48px có tooltip, nhớ trạng thái ở
`localStorage`), `TopicTrail` (hàng chip cuộn ngang trên di động, chip đang chọn
được đưa vào giữa), `SegmentedFilter` (lọc độ khó có ba thanh, lưới 2×2 ở 390px),
dòng kết quả `aria-live`, gợi ý "Mới bắt đầu?", phân trang chuyển về `#danh-sach`.
`TopicSidebar` bị xoá; `FilterPills` giữ lại cho trang Video (bước 5). Chưa làm:
M2 (đổi chủ đề chỉ mờ chữ hero: hiện hero vào lại bằng M1 vì chuyển chủ đề là đổi
route), gợi ý mức độ khác kèm số đếm (cần truy vấn đếm theo độ khó, đã hoãn).

**Thiết kế lại giao diện — bước 5a (danh sách Blog).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-5a-danh-sach-blog.md`. `/blog` được
ráp lại: thẻ số liệu một ô ("Bài viết"), video nền của hero có nút tạm dừng/phát 44px
(`HeroBackdrop`: provider + lớp video + dòng credit; dừng khi ra khỏi màn hình, nhớ
lựa chọn tạm dừng của người đọc, không tự phát khi bật giảm chuyển động nhưng nút vẫn
phát được), `PageHero` nhận `backdrop` và `below` (bỏ `backdropVideo`; `backdropImage`
vẫn dùng cho trang Video), h2 "Tất cả bài viết" kèm dòng kết quả `aria-live`,
`Pagination` dùng chung (chuyển về `#danh-sach`), `EmptyState` có hai nút (Bài học,
Video), thẻ bài không ảnh và không chủ đề có khối trung tính với biểu tượng tài liệu.
Chưa xác minh được: nhánh giảm chuyển động của `HeroBackdrop` (trình duyệt không giả lập
được), danh sách có bài thật (chưa có dữ liệu Supabase cục bộ), `npm run build`. Khoá
i18n `forum.empty` và `forum.postsHeading` không còn dùng.

**Thiết kế lại giao diện — bước 5b (khung bài viết).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-5b-khung-bai-viet.md`. Bài Blog và
bài Bài học chi tiết dùng chung `ArticleShell`: cột chữ 768px + cột phải 272px từ 1024px
(cột phải luôn giữ chỗ, kể cả khi bài không có mục lục, để bài không nhảy vị trí), nút
"Về Blog"/"Về chủ đề" 44px, tiêu đề 46px (34px trên di động), dòng thông tin, `LangPill`
(liên kết bản dịch), phần đầu bài hiện dần một lần bằng CSS `.hero-in` (BL8: thấy được khi không có JS, tắt khi giảm chuyển động).
Mục lục: `TocRail` cố định bên phải, hàng đang đọc tô đen (`aria-current="location"`, logic
thuần `pickActiveHeading` có test); dưới 1024px là `details` mặc định đóng (bản vẽ vẽ
mở, lệch có chủ đích). Chữ tiếng Anh theo bản vẽ ("Posted", "In this article"). Ô "Báo
lỗi" cao 52px. Không có trong bản vẽ nên không làm: thanh tiến độ đọc, chia sẻ, khối tác
giả, bài trước/sau, breadcrumb. Neo mục lục dùng `scroll-padding-top` của `html` (đặt thêm
`scroll-margin` sẽ cộng dồn thành 192px). Chưa xác minh: bài thật có ảnh bìa (chưa có dữ
liệu cục bộ; kiểm bằng trang mẫu tạm, đã xoá), `npm run build`. Bình luận là bước 5c,
Video chi tiết là bước 5e.

**Thiết kế lại giao diện — bước 5c (bình luận).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-5c-binh-luan.md`. `CommentSection` tách
thành `components/forum/comments/` (`CommentForm`, `CommentItem`, `CommentEmpty`); logic thuần
(kiểm tra, chữ cái avatar, nhận bình luận mới) ở `src/lib/comment-form.ts` có test. Form dùng
`Field`/`FormNotice`/`Button busy` của bước 1 (lần đầu chúng lên trang thật; `Input` và
`Textarea` nay nhận `ref`): nhãn luôn hiện, lỗi mọi ô cùng lúc và focus ô sai đầu tiên,
thông báo lỗi/thành công có biểu tượng, nút gửi đổi nhãn "Đang gửi..." mà không mất focus.
Bấm "Trả lời" cuộn tới form và focus ô nội dung. Bình luận có avatar, huy hiệu Tác giả, nút
Trả lời 44px, thụt lề một cấp; bình luận mới hiện dần (tắt khi giảm chuyển động). Vẫn gửi qua
`POST /api/comments` (không đổi route, truy vấn hay migration); trang Video dùng chung nên
được thiết kế lại theo. Chưa xác minh: gửi bình luận thật thành công (không có Supabase cục
bộ; đã thử nhánh lỗi API thật), nhánh giảm chuyển động, `npm run build`. Không làm: bộ đếm ký
tự (theo quyết định của người bảo trì).

**Thiết kế lại giao diện — bước 5d (danh sách Video).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-5d-danh-sach-video.md`. `/video` dùng lại bộ
thành phần của trang Bài học: thẻ số liệu 3 ô (Video, Nền tảng, Chủ đề) với ảnh nền có lớp
phủ trái→phải (`PageHero`), khối lọc trên máy tính gồm `SegmentedFilter` (vòng số chủ đề, 3
thanh độ khó) và hàng Sắp xếp là 4 liên kết bấm là áp dụng (bỏ ô chọn native và nút Áp
dụng); dưới `lg` là ô thu gọn `FilterDisclosure` (mũi tên xoay, huy hiệu đếm, mở sẵn khi
đang lọc). Dòng kết quả `aria-live` liệt kê mọi bộ lọc đang bật, nút "Xoá bộ lọc (n)" 44px.
`VideoCard` làm lại theo dáng `PostCard` (huy hiệu nền tảng, nút phát, khối màu theo chủ
đề khi không có ảnh xem trước như TikTok). Truy vấn mới `countVideos` (đếm tổng, không lọc):
hero luôn hiện tổng thật và chỉ khi 0 video mới ẩn bộ lọc. Lọc ra rỗng chỉ có nút "Xoá hết
bộ lọc" (không có gợi ý nới lỏng kèm số đếm, không có hiệu ứng mờ khi chờ V6 — quyết định
của người bảo trì). `FilterPills` không còn được dùng (chỉ còn kiểu `ListingHref` export từ
file đó). Bỏ `scroll-mt-24` ở neo danh sách của Bài học và Blog vì nó cộng dồn với
`scroll-padding-top` của `html`. Khoá i18n không còn dùng: `videos.applySort`, `filtersToggle`,
`filtersToggleActive`, `empty`, `emptyFiltered`. Chưa xác minh: danh sách có video thật (không
có Supabase cục bộ; kiểm bằng trang mẫu tạm), `npm run build`.

**Thiết kế lại giao diện — bước 5e (Video chi tiết).** Kế hoạch:
`docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-5e-video-chi-tiet.md`. `/video/[slug]` được
ráp lại và **không** dùng `ArticleShell`: một cột trái 896px, không hero, không mục lục. Player
lớn bấm-để-phát dùng lại facade của bài viết qua biến thể `video-embed-lg`
(`videoFacadeHtml(ref, locale, { large, title })`): bo 24px, nút tròn 68px viền trắng 3px, iframe
mờ dần khi tải xong (`is-loaded`); dưới player là dòng nhắc quyền riêng tư có biểu tượng khoá.
Đầu trang: hàng chip (nguồn `Cpu`/`Bookmark`, `DifficultyMark`, `TopicChip`), h1 46/34px, hàng
ngày đăng + nút chuyển ngôn ngữ 44px (`hrefLang`), hàng nút: chính "Xem bài học liên quan"
(`BookOpen` + mũi tên) chỉ khi có bài học, phụ "Xem trên {platform}" mở tab mới (`sr-only`
"(mở trong tab mới)"). Thân bài rỗng hiện hộp nét đứt với `videos.noDescription`; khối "Bài học
liên quan" (h2 26px + `RelatedLessonCard` dạng thu gọn) chỉ khi có bài học. `VideoFacades` nay
thêm `is-loaded` khi iframe tải xong và giữ một vùng `sr-only role="status"` đọc "Đang tải video"
trong lúc chờ. Truy vấn `getLessonByTranslation` mang thêm `excerpt`, `difficulty`, `published_at`
(không migration), qua `toRelatedLesson` có test. Không có Supabase cục bộ nên kiểm bố cục bằng
trang mẫu tạm ở `/ui-gallery/video-detail` (đã xoá): ở 1280 và 390 không tràn ngang; player
896×504 (TikTok 340×604 căn giữa), nút và hàng đều 44px, h1 46/34px; bấm facade tạo iframe được
focus, có `is-loaded` và opacity 1, chuột phải/Ctrl mở tab mới (không chặn), thân rỗng hiện hộp,
thiếu bài học/nguồn thì ẩn nút và player. Chưa xác minh: nhánh giảm chuyển động (công cụ trình
duyệt không giả lập được), `npm run build`. **Giới hạn đã biết (D3):** "Xem trên TikTok" vẫn mở
trang nhúng vì không lưu username nên không dựng được URL xem thường. Bước 5 (Blog, bài viết,
bình luận, danh sách Video, Video chi tiết) **đã xong**; tiếp theo là bước 6 (Tìm kiếm + popover;
Liên hệ, Giới thiệu, Đóng góp, Bảo mật) và bước 7 (404 và trang lỗi).

**Thiết kế lại giao diện — bước 6a (Tìm kiếm + popover).** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-6a-tim-kiem.md`. `/tim-kiem` được ráp lại: hero
có thẻ số liệu ba ô (bài học/video/blog), ô tìm kiếm dùng chung `SearchForm` nay là pill 52px có
nhãn hiện (SearchField), dòng kết quả `aria-live` ("Hiển thị {shown} trong {total} kết quả cho
«query»"), rồi từng nhóm Bài học → Video → Blog (ô biểu tượng 40px, h2 26/22px, đếm theo nhóm, ghi
chú "Đang hiện 10 kết quả đầu tiên." khi hơn 10) và lưới 2 cột (1 cột dưới 640px) thẻ
`SearchResultRow` (KindLabel, TopicChip, DifficultyMark, ngày; tiêu đề/trích đoạn tô từ khoá). Tô
từ khoá bằng `Mark` trên logic thuần `src/lib/search-highlight.ts` (bỏ dấu, khớp **tiền tố theo
từ**, có test) khớp đúng luật của `search_posts` nên không tô chỗ CSDL không khớp. Trạng thái đầu
(chưa có từ khoá) và trạng thái rỗng dùng lại `EmptyState` (thêm slot `children`): pill gợi ý 5 từ
khoá (vi/en khác nhau), chip duyệt theo chủ đề (số đếm từ `countLessonsByTopic`), hộp trích từ khoá
và hai nút "Xoá từ khoá"/"Xem bài học". Popover navbar theo bản vẽ: panel 380px, nhãn "Tìm trong
Chíp Chíp" + dòng gợi ý, tự focus khi mở, Escape/bấm ra ngoài đóng và trả focus về nút; ô trong menu
di động dùng biến thể tối. Khoá i18n không còn dùng: `search.prompt`, `search.noResults`. Không có
Supabase cục bộ nên trạng thái có kết quả kiểm bằng trang mẫu tạm ở `/ui-gallery/search` (đã xoá):
1280 lưới 2 cột (thẻ 600px), 390 một cột (350px), `mark` đúng cả khi chỉ khớp tiền tố ("đan" trong
"đang"), không tràn ngang, mọi target ≥44px; trạng thái đầu/rỗng và popover kiểm trên trang thật
(popover 380px, nhãn + gợi ý, focus vào ô, Escape trả focus về nút — `press_key` của công cụ trình
duyệt không phân phối được phím nên Escape kiểm bằng keydown thật). Sau review đã sửa: màu dòng gợi
ý ở biến thể tối (nay theo biến thể, giữ 4.5:1 bằng test), tô từ khoá không còn tô sai trong
email/URL (`.`, `@`, `/` không tính là ranh giới từ, khớp parser của Postgres), dòng kết quả có dạng
"{n}+" khi một nhóm chạm trần 50, và pill đúng 52px như bản vẽ. Chưa xác minh: nhánh giảm chuyển
động. Trạng thái lỗi tìm kiếm (cần `searchPosts` trả về trạng thái) để sang bước 7. Tiếp theo: 6b Liên hệ (+ Báo lỗi bài), 6c Giới thiệu, 6d Đóng góp + Bảo mật,
rồi bước 7 (404 và trang lỗi).

**Thiết kế lại giao diện — bước 6b (Liên hệ + Báo lỗi bài).** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-6b-lien-he.md`. `/lien-he` dùng `PageHero`
full-width rồi thân hai cột (form 1.5fr, aside 1fr): form trong thẻ bo 24px; aside là các `InfoBlock`
(thẻ trắng, icon tròn 32px) — email (ẩn khi trống), mạng xã hội (ẩn khi trống), "Khi nào có phản
hồi", "Trước khi gửi" (huy hiệu 3 + ghi chú giới hạn, rồi khiên + chính sách bảo mật). `MessageForm`
nay dựng trên `Field`/`Input`/`Textarea`, `RadioSegment` (chọn Liên hệ/Góp ý, gợi ý đổi theo lựa
chọn), `FormNotice`, `Button`: kiểm **mọi ô cùng lúc** khi gửi (hàm thuần `validateMessageFields`
có test) — hiện thông báo gộp "Cần sửa n chỗ" kèm liên kết tới từng ô, đánh dấu từng ô và focus ô
sai đầu tiên; trạng thái đang gửi (ô readOnly, `aria-busy`, nút "Đang gửi…", không spinner), đã gửi
(nhấn + dấu tích, xoá form), lỗi máy chủ (tiêu đề riêng + dòng "nội dung vẫn còn"). "Báo lỗi bài
này" dùng `Disclosure` dùng chung (hàng 56px, đĩa "+") bọc trong thẻ có viền — cùng mẫu disclosure
với FAQ (bước 6c) và bộ lọc di động; chỉ `FilterDisclosure` (bảng lọc video) còn là bản riêng vì đó
là panel lọc, không phải disclosure nội dung (quyết định D1). Ô nhập vẫn dùng token `field` #767676
(D3); thành công dùng màu nhấn + dấu tích, đỏ chỉ cho lỗi (D2). `Field` thêm `id` tuỳ chọn (để liên
kết neo tới ô) và giữ
dấu cách trước ghi chú "(không bắt buộc)". Không có Supabase cục bộ nên kiểm bằng trang thật +
gallery tạm `/ui-gallery/contact` (đã xoá): 1280/390 không tràn ngang, aside 2 thẻ, gửi rỗng → "Cần
sửa 2 chỗ" + đánh dấu tên/nội dung + focus ô tên, gợi ý đổi khi chọn "Góp ý", nút báo lỗi 56px mở
ra form bên trong; mọi target thật ≥44px. Sau review đã sửa: thông báo gộp nêu **thông báo lỗi**
(mỗi liên kết cao 44px) thay vì nhãn ô, vùng `aria-live` luôn có trong DOM (rỗng thì ẩn) và chỉ các
ô mang `aria-busy`, focus chuyển bằng `flushSync` nên ô đã có `aria-invalid` + `aria-describedby`
trước khi nhận focus, radio khoá khi đang gửi, và thêm dòng nhắc giới hạn dưới nút ở Báo lỗi bài.
Chưa xác minh: trạng thái đang gửi/đã gửi (cần API thật), nhánh giảm chuyển động. Tiếp theo: 6c Giới
thiệu, 6d Đóng góp + Bảo mật, rồi bước 7 (404 và trang lỗi).

**Thiết kế lại giao diện — bước 6c (Giới thiệu).** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-6c-gioi-thieu.md`. `/gioi-thieu` dùng `PageHero`
với ảnh banner (`ABOUT_BANNER`) ở cột phải (bỏ hero tự viết và `.rise-in`); khối tác giả (thẻ bo
24px) dùng `Avatar` chung (ảnh hoặc chữ cái đầu, 112/176px); bốn cam kết dùng `InfoCard` (icon tròn
40px, dạng dòng trên điện thoại, cột từ `sm`) hiện dần bằng `CardReveal`; FAQ chuyển sang `Disclosure`
dùng chung (hàng 60px, đĩa "+") kèm gợi ý "Chưa thấy câu trả lời? Viết cho tác giả" (khoá
`about.faq.moreHint`/`moreLink`) — trên điện thoại gợi ý nằm dưới danh sách, từ `lg` nằm dưới tiêu
đề; "Những người đã đồng hành" vẫn ẩn khi `CONTRIBUTORS` rỗng, khi có người thì lưới thẻ `Avatar`
44px + tên/vai trò; CTA cuối là panel tối bo 24px với hai nút (`Button` thêm biến thể `onDarkOutline`
viền trắng, cạnh `onDark`). Kiểm bằng trình duyệt trên trang thật: 1280/390 không tràn ngang, hàng
FAQ 60px và `<details>` ẩn/hiện nội dung đúng (`checkVisibility()`), banner 3:2 (558×371 / 348×231),
nút CTA 44px, mục "Những người đã đồng hành" vắng mặt khi rỗng. Sau review đã sửa: gợi ý FAQ cách
tiêu đề 12px (thay vì 64px do khoảng cách hàng của grid) và danh sách FAQ nằm trong panel trắng viền
1px bo 16px; thẻ người đóng góp xếp avatar bên trái tên; `Avatar` yêu cầu đúng cỡ ảnh (44/112/176) và
có viền mảnh; liên kết dùng duration token; đã xoá CSS `.rise-in` thừa; câu chữ EN của gợi ý khớp bản
vẽ. Chưa xác minh: tên tác giả/người đóng góp dài (chữ hiện ngắn), lưới người đóng góp khi có dữ liệu,
nhánh giảm chuyển động. Tiếp theo: 6d Đóng góp + Bảo mật, rồi bước 7 (404 và trang lỗi).

**Thiết kế lại giao diện — bước 6d (Đóng góp + Bảo mật).** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-6d-dong-gop-bao-mat.md`. `/dong-gop`: hero chỉ
còn chữ (bỏ thẻ số liệu "4·1·0" theo quyết định D1); bốn thẻ cách góp sức làm lại (`WayCard`: phiến
màu theo tông xám + ô icon 48px + watermark icon mờ, tiêu đề 18px, thân 14px, nút pill phụ 44px
"Nhắn cho tác giả" kèm `sr-only` nêu tên cách) xếp 2 cột, trên điện thoại phiến thành ô 64px bên
trái; panel ghi chú (nền trắng 50%, icon 44px) có liên kết "Những người đã đồng hành" trỏ tới trang
Giới thiệu (D3) — `contribute.note` rút gọn và thêm `contribute.noteLink`. `/chinh-sach-bao-mat`: thân
hai cột — mục lục bên phải dùng lại `TocRail` (cố định, hàng đang đọc tô đen, `aria-current="location"`,
theo cuộn) từ 1024px, dưới đó là dải chip `DocTocTrail`; panel tài liệu bo 24px chứa cột 768px: dòng
"cập nhật" (icon lịch), sáu mục **đánh số** (vòng số 28/32px + h2 22/26px, `tabindex="-1"`), danh sách
chấm đầu dòng và CTA cuối. Không đổi câu chữ Bảo mật hay `PRIVACY_UPDATED`. Kiểm bằng trình duyệt:
1280/390 không tràn ngang; Đóng góp 2 cột → 1 cột, CTA 44px với tên truy cập đúng ("Nhắn cho tác giả:
Viết bài"…); Bảo mật 6 mục đánh số, mục lục hiện ở 1280 / ẩn ở 390 (dải chip thay thế), hàng đang đọc
chuyển theo, và bấm liên kết mục lục đưa heading dừng ở 96px (thoát navbar 78px). Sau review đã sửa:
phiến thẻ Đóng góp thành dải full-width cao 112px từ `sm` (trước là ô 64px cố định làm mất watermark),
tiêu đề nằm cạnh phiến trên điện thoại; thêm `h2` ẩn `contribute.waysHead` để tiêu đề thẻ không nhảy
cấp h1→h3; sửa `calc` của lớp mờ dải chip (và ở `TopicTrail` cùng lỗi có sẵn); nhãn mục lục của rail
`aria-hidden`, danh sách giữ `role="list"`, chữ dài tự ngắt. Chưa xác minh: nhánh giảm chuyển động.
**Bước 6 (Tìm kiếm, Liên hệ, Giới thiệu, Đóng góp, Bảo mật) đã xong**; tiếp theo là bước 7 (404 và
trang lỗi, gồm cả trạng thái lỗi tìm kiếm).

**Thiết kế lại giao diện — bước 7 (404 và trang lỗi).** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-7-trang-loi.md`. Trang lỗi dùng chung khung
`EmptyState` mở rộng (thêm `eyebrow`, cấp tiêu đề `h1`, biến thể chip và slot `after` — đây chính là
"ErrorState" của bản vẽ), và `ChipArt` vẽ thêm "404"/"!" trong cùng hình chip. **404 toàn cục**: panel
nét đứt (eyebrow "Lỗi 404", h1 46/34, mô tả), ô tìm kiếm dùng lại `SearchForm` (nhãn ẩn, GET sang
`/tim-kiem?q=`), hai nút (về trang chủ / xem bài học), hàng pill "Hoặc đi tới" (Blog, Video, Giới
thiệu) và dòng gợi ý "Báo cho chúng tôi" (liên kết 44px) — chạy cả khi tắt JS. **404 bài viết** (bài
học/blog/video) dùng một `ArticleNotFound` chung: cùng khung, tiêu đề/mô tả theo loại, nút về danh
sách + nút Tìm kiếm; không đánh dấu mục menu (vỏ chung không biết ngữ cảnh) — chấp nhận. **Trang lỗi
runtime** (`error.tsx`): chip "!", nút Thử lại có trạng thái đang gửi (`aria-busy`, nhãn "Đang thử
lại…", dòng `role=status`, không spinner) và dòng ER7 `role=alert` sau lần thử lại đầu vẫn lỗi; hiện
`error.digest` (chọn-cả-chuỗi, không nút sao chép) và dòng gợi ý báo lỗi. **Trạng thái lỗi tìm kiếm**
(đã hoãn từ 6a): `searchPosts` nay trả `{ posts, failed }`; nếu một nhóm lỗi thì trang hiện dòng "Không
lấy được kết quả cho «q»" và panel lỗi (Thử lại / Xem bài học) thay vì coi như rỗng. Khoá i18n: thêm
namespace `errors.*` và `search.resultFailed/errorTitle/errorBody/retry`; bỏ khoá thừa
(`common.error/retry/notFound*/backHome/errorDescription`, ba `notFound` chi tiết). Kiểm bằng trình
duyệt: các URL lạ trả **404** (toàn cục và ba loại bài), panel/h1/nút/pill/hint đúng ở 1280 và 390
(không tràn ngang, liên kết gợi ý 44px); trạng thái lỗi tìm kiếm và trang lỗi runtime kiểm qua gallery
tạm (đã xoá) — 2 panel lỗi, mã lỗi hiện, bấm Thử lại thì dòng ER7 hiện. Giới hạn đã biết vẫn còn: 404
của route chi tiết do Next 14 stream khung chung trước khi hydrate (chỉ nâng cấp Next mới sửa).
Sau review đã sửa: ba route ảnh OG của bài chi tiết hết đọc khoá `notFound` đã xoá (nay dùng
`errors.titleLesson/titlePost/titleVideo`); panel 404/lỗi chuyển hiệu ứng vào CSS `.fade-up` nên hiện
được **cả khi tắt JS** (trước đó framer-motion giữ `opacity: 0` tới khi hydrate — 404 trắng); nút Thử
lại dùng `aria-disabled` thay `disabled` để giữ focus bàn phím; `ChipArt` đặt font qua `style` (biến
CSS không phân giải trong thuộc tính trình bày của SVG). **Đợt thiết kế lại giao diện đã xong (bước
1–7).** Việc còn lại trước ra mắt là nội dung và dữ liệu — xem mục 6 và mục 7 dưới.

**Bổ sung theo kế hoạch hoạt động — bước 8 (đăng ký, đội ngũ, báo chí).** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-8-dang-ky-doi-ngu-bao-chi.md`. Ba việc lấy từ file kế
hoạch hoạt động của chủ dự án, giữ đúng tinh thần dự án một người: **`/dang-ky`** (en `/sign-up`) là một
trang với form chọn loại — Tình nguyện viên / Khảo sát / Webinar / Cuộc thi — dùng lại đường `messages`
sẵn có (**không thêm bảng**; chỉ thêm bốn giá trị `message_kind`), admin đọc chung hộp thư với nhãn
riêng; form này cũng được **nhúng ở trang Giới thiệu**. Trang Giới thiệu đổi câu chữ theo file ("Khai
phá những vùng đất mới" / "Hơn cả một dự án… Bắt đầu từ số 0, kết thúc là thành công"; câu CTA cuối
"Muốn cùng nhau phát triển cộng đồng…"), mục "Những người đã đồng hành" đổi thành **Đội ngũ** (thẻ có
ảnh khi bổ sung; vẫn ẩn khi rỗng). Thêm **`/bao-chi`** (en `/press`) — thông tin cơ bản, cách dẫn nguồn,
liên hệ báo chí, chỗ chờ danh sách bài viết về dự án. **Lưu ý khi lên production: migration mới
`20261001000000_signup_kinds.sql` phải chạy trước khi deploy code** (đúng thứ tự ở README). Kiểm bằng
trình duyệt: `/vi/dang-ky` 1280/390 không tràn ngang, bốn lựa chọn, gợi ý đổi theo loại, gửi rỗng →
"Cần sửa 2 chỗ" + focus ô tên; `/vi/bao-chi` đủ ba mục, nút liên hệ 44px; `/vi/gioi-thieu` hiện câu chữ
mới + form nhúng và mục Đội ngũ vắng khi rỗng; `/en/sign-up` và `/en/press` trả 200. Chưa xác minh:
trạng thái gửi thành công của form đăng ký (cần Supabase thật) và `verify-security.sh` (cần Supabase
local). Sau review đã sửa: thêm liên kết **Báo chí** ở footer (trang từng bị mồ côi, không có đường vào),
khoá test cho hai URL mới (`/dang-ky` ↔ `/en/sign-up`, `/bao-chi` ↔ `/en/press`), bỏ thuộc tính thừa ở
tiêu đề trang báo chí, và cập nhật README về trường `photo` của `CONTRIBUTORS`.

**Bước 9 — tách trang Đăng ký và dọn nốt các mục nhỏ.** Kế hoạch:
`docs/superpowers/plans/2026-10-01-thiet-ke-lai-buoc-9-tach-dang-ky.md`. Bốn loại đăng ký nay **mỗi loại
một trang riêng**, URL bản địa hoá: `/dang-ky/tinh-nguyen` ↔ `/en/sign-up/volunteer`, `/dang-ky/khao-sat`
↔ `/en/sign-up/survey`, `/dang-ky/webinar` ↔ `/en/sign-up/webinar`, `/dang-ky/cuoc-thi` ↔
`/en/sign-up/competition`; mỗi trang có tiêu đề/mô tả/SEO riêng và form **không còn bộ chọn loại** (loại
lấy từ route). `/dang-ky` thành trang giới thiệu bốn lựa chọn (thẻ có icon, liên kết sang từng trang);
trang Giới thiệu thay form nhúng bằng bốn liên kết. Dọn nốt các mục nhỏ đã hoãn: mọi `hover:` ở khu vực
công khai được scope `[@media(hover:hover)]:` (tránh hover dính trên cảm ứng); panel 404/lỗi **cả trang**
chuyển sang `role="status"` (lỗi tìm kiếm — thay đổi bất đồng bộ — vẫn `role="alert"`); map kind→icon
dùng chung một chỗ; hai form tìm kiếm có tên landmark riêng; nhãn honeypot lấy từ catalogue; sitemap liệt
kê bốn trang loại và test khoá lại. Kiểm bằng trình duyệt: 10 URL (4 loại × 2 ngôn ngữ + hai trang mục)
trả **200**, 404 vẫn 404; trang giới thiệu 4 liên kết, không tràn ngang ở 1280/390; trang loại có hero +
form không bộ chọn + link về; Giới thiệu có 4 liên kết; trang tìm kiếm có hai landmark tên khác nhau.
Chưa xác minh: trạng thái gửi thành công của form (cần Supabase thật).
Sau review đã sửa: đợt scope hover còn sót — `Button` (các variant), `Field`, và cả khu vực công khai còn lại
(Navbar, FooterNav, SocialLinks, Disclosure, RadioSegment, các section trang chủ) nay đều đã scope; form
tìm kiếm ở menu di động có tên landmark; landmark tìm kiếm của trang 404 không trùng nhãn ô nhập; bỏ khoá
`signup.openLink` (thêm nhưng không dùng); sửa hai chú thích cũ; test route nay khoá cả bốn slug bản địa
hoá chứ không chỉ khoá tên route. Đã xác minh Tailwind sinh đúng rule trong `@media(hover:hover)` (đọc file
CSS build ra), nên hover không bị mất.

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

Tại thời điểm viết tài liệu này: `npm test` → **50 file, 481 test, tất cả
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
6 câu FAQ mẫu, 6 video carousel giữ chỗ (mượn từ dự án Strike Robot, nội dung
không liên quan bán dẫn), logo + mascot dạng vector nền trong suốt, logo
Micron (còn thiếu), xác nhận quyền dùng các clip/ảnh đã đưa vào, và **nội dung bài học thật** — phần thiếu lớn nhất, hiện trang
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
- **"Xem trên TikTok" mở trang nhúng, không phải URL xem thường.** Không lưu
  username TikTok nên không dựng được link watch (bước 5e, quyết định D3). Sửa
  thì phải thêm cột lưu username.
- Trang riêng cho từng quốc gia và bản đồ silhouette các nước — nằm ngoài
  phạm vi đã chốt ở roadmap (`docs/superpowers/specs/2026-09-28-lo-trinh-nang-cap-design.md`).
- Vài mục cosmetic của đợt thiết kế lại giao diện để lại trong ledger, không cái
  nào chặn ra mắt: `listing/FilterPills.tsx` là code chết (chỉ còn giữ type
  `ListingHref` mà nơi khác import — nên chuyển type sang `src/lib/types.ts` rồi
  xoá), lưới thẻ ở `/dang-ky` truyền cứng `columns={2}` cho hiệu ứng so le, và
  bốn trang đăng ký là bốn file `page.tsx` gần giống nhau (đánh đổi để có URL
  tiếng Anh riêng cho từng loại). Ghi chú đầy đủ:
  `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-9-tach-dang-ky/notes.md`.

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
