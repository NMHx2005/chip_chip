# Hero, dải quốc gia, sơ đồ Ecosystem, video thật — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay các phần giữ chỗ trên trang chủ bằng video, logo, cờ/bản đồ thật; làm lại dải quốc gia (5 nước) theo docx; thêm sơ đồ Ecosystem vẽ bằng code.

**Architecture:** Dữ liệu tĩnh (nước, công ty, video) nằm trong `src/lib/constants.ts`; logic dựng URL nhúng YouTube nằm trong `src/lib/video.ts` (thuần, có test); UI là client component `CountryBands` cộng một server component `EcosystemDiagram`. Không đổi schema DB, không thêm dependency.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, next-intl, framer-motion, Vitest, `ffmpeg`/`yt-dlp` (chỉ dùng ở máy dev để cắt clip, không vào repo).

**Spec:** `docs/superpowers/specs/2026-09-29-quoc-gia-video-hero-design.md`

## Điều kiện tiên quyết (chủ dự án làm trước)

Nhánh `fix/review-ux-hardening` đang có 43 file sửa chưa commit, trong đó có `CountryBands.tsx`, `Hero.tsx`, `PageHero.tsx`, `messages/*.json`. Plan này sửa cùng các file đó, nên phải **commit hoặc stash chúng trước**, rồi tạo nhánh mới `feat/quoc-gia-video-hero` từ đó. Không bắt đầu Task 1 khi cây làm việc còn sửa dở.

## Global Constraints

- Reply cho chủ dự án bằng tiếng Việt; code, comment, commit bằng tiếng Anh, Conventional Commits, **không dòng attribution** (theo `CLAUDE.md` của dự án).
- Mọi chuỗi hiển thị qua `src/messages/{vi,en}.json`, hai file cùng bộ khoá (`src/messages/keys-parity.test.ts` phải xanh).
- Chuyển động dùng token trong `src/components/motion/tokens.ts` (`EASE_STANDARD`…) và tôn trọng `prefers-reduced-motion`.
- Không thêm dependency. Không `dangerouslyDisableSandbox`, không push, không `supabase db push`.
- URL công ty và mốc video lấy từ hằng số trong `constants.ts`, không từ input người dùng.
- Link ngoài: `target="_blank" rel="noopener noreferrer"`.
- Clip tự host: 720p, không tiếng, H.264 + `faststart`; mỗi clip ≤ 5 MB. Ghi nguồn cho từng clip.
- CSP hiện cho phép `frame-src https://www.youtube-nocookie.com` (`next.config.mjs:74`); chỉ nhúng qua host này.
- Trước khi báo xong: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` đều xanh (không chạy `next build` khi `next dev` đang chạy).

## Review Focus

- Thiết bị cảm ứng / bàn phím không hover được: logo công ty phải luôn tiếp cận được (test dữ liệu + kiểm tra tay ở 375px).
- Video YouTube chưa bấm không được tải iframe (facade), để trang chủ không nặng thêm.
- Mốc `start`/`end` không hợp lệ (âm, `end <= start`, id sai định dạng) phải bị từ chối, không dựng ra URL lỗi.
- Công ty thiếu logo (Micron) vẫn hiện tên dạng chữ và vẫn bấm được.
- `prefers-reduced-motion`: không có chuyển động chồng cờ/bản đồ khi bật.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `public/logos/*` (mới) | Logo công ty đã tối ưu |
| `public/countries/*` (mới) | Cờ và bản đồ 5 nước |
| `public/video/hero-intro.mp4`, `asml-part1..4.mp4`, `tsmc-open.mp4` (mới) | Clip tự host đã duyệt |
| `public/hero-backdrop.jpg` (mới, thay `hero-backdrop.svg`) | Ảnh nền hero |
| `src/lib/video.ts` (sửa) | Thêm `youtubeClipEmbedUrl` |
| `src/lib/video.test.ts` (sửa) | Test hàm trên |
| `src/lib/country-clips.ts` (mới) | Mốc video 5 nước (đã duyệt) |
| `src/lib/constants.ts` (sửa) | `COUNTRY_BANDS`, `HOME_VIDEO`, `TOPIC_VIDEOS`, `HERO_BACKDROP`, `ECOSYSTEM_GROUPS` |
| `src/lib/constants.test.ts` (mới) | Test tính hợp lệ của dữ liệu |
| `src/components/sections/CountryBands.tsx` (sửa) | Dải quốc gia mới |
| `src/components/sections/CountryVideo.tsx` (mới) | Facade YouTube có mốc |
| `src/components/sections/EcosystemDiagram.tsx` (mới) | Sơ đồ Ecosystem |
| `src/components/sections/Hero.tsx` (sửa) | Khoảng cách tên, credit video |
| `src/app/[locale]/page.tsx` (sửa) | Đặt `EcosystemDiagram` trước `CountryBands` |
| `src/messages/{vi,en}.json` (sửa) | Chuỗi mới |
| `docs/BAN-GIAO.md` (sửa) | Cập nhật trạng thái |

---

### Task 1: Đưa asset vào repo

**Files:**
- Create: `public/logos/{nvidia,broadcom,amd,intel,qualcomm,tsmc,samsung,sk-hynix,asml,smic,apple,texas-instruments,globalfoundries,umc}.{svg,webp,png}`
- Create: `public/countries/{usa,taiwan,china,south-korea,netherlands}-{flag,map}.{svg,png,webp}`
- Create: `public/video/{hero-intro,asml-part1,asml-part2,asml-part3,asml-part4,tsmc-open}.mp4`
- Create: `public/hero-backdrop.jpg`; Delete: `public/hero-backdrop.svg`, `public/video/clip-1..6.mp4`, `public/video/intro-placeholder.mp4` **chỉ ở Task 7** (sau khi không còn tham chiếu).

**Interfaces:**
- Produces: các đường dẫn công khai `/logos/<slug>.<ext>`, `/countries/<id>-flag.<ext>`, `/countries/<id>-map.<ext>`, `/video/*.mp4`, `/hero-backdrop.jpg`. Các task sau chỉ dùng đúng những đường dẫn này.

Nguồn: `/Users/nmh/Downloads/drive-download-20260929T080849Z-1-001/{Logo công ty,Quốc gia}`; clip đã cắt ở `/tmp/claude-501/vid/out/` (scratchpad, xoá khi phiên kết thúc — nếu mất, cắt lại theo mốc trong spec §3.1 bằng lệnh ở bước 3).

- [ ] **Step 1: Chốt bảng tên file.** Logo (nguồn → đích): `Nvidia_logo.svg.webp`→`nvidia.webp`, `Broadcom_logo_(2016-present).svg.webp`→`broadcom.webp`, `AMD-Logo.png`→`amd.png`, `Intel-logo-2022.png`→`intel.png`, `Qualcomm-Logo.svg.webp`→`qualcomm.webp`, `Tsmc.svg.webp`→`tsmc.webp`, `Samsung_wordmark.svg`→`samsung.svg`, `SK_Hynix.svg.webp`→`sk-hynix.webp`, `01a33cb833868737d8409a0f67b912a0.webp`→`asml.webp` (đã xác nhận là logo ASML; nền có watermark "cleanpng" mờ, hỏi chủ dự án có bản sạch hơn không), `SMIC_logo.svg.webp`→`smic.webp`, `Apple-Logo.png`→`apple.png`, `TexasInstruments-Logo.svg.webp`→`texas-instruments.webp`, `GlobalFoundries_logo.svg.webp`→`globalfoundries.webp`, `UMC-Logo.svg.webp`→`umc.webp`. **Micron không có trong Drive** → không tạo file, `logo: null`.
  Cờ/bản đồ: `Flag_of_the_United_States.svg.webp`→`usa-flag.webp`, `USA_Flag_Map.svg`→`usa-map.svg`, `Flag_of_the_Republic_of_China.svg.webp`→`taiwan-flag.webp`, `Flag_Map_of_Taiwan_(Republic_of_China).png`→`taiwan-map.png`, `Flag_of_the_People_s_Republic_of_China.svg.webp`→`china-flag.webp`, `Flag-map_of_the_People_s_Republic_of_China.svg.webp`→`china-map.webp`, `Flag_of_South_Korea.svg.webp`→`south-korea-flag.webp`, `Flag-map_of_South_Korea.svg`→`south-korea-map.svg`, `Flag_of_the_Netherlands.svg.webp`→`netherlands-flag.webp`, `Flag-map_of_the_Netherlands.svg.webp`→`netherlands-map.webp`.

- [ ] **Step 2: Sao chép và thu nhỏ ảnh raster lớn** (AMD 5000px, Apple 3840px, Intel 3000px) về chiều rộng tối đa 600px:

```bash
SRC="/Users/nmh/Downloads/drive-download-20260929T080849Z-1-001"
mkdir -p public/logos public/countries
cp "$SRC/Logo công ty/Samsung_wordmark.svg" public/logos/samsung.svg
for pair in "Nvidia_logo.svg.webp:nvidia.webp" "Broadcom_logo_(2016-present).svg.webp:broadcom.webp" \
  "Qualcomm-Logo.svg.webp:qualcomm.webp" "Tsmc.svg.webp:tsmc.webp" "SK_Hynix.svg.webp:sk-hynix.webp" \
  "01a33cb833868737d8409a0f67b912a0.webp:asml.webp" "SMIC_logo.svg.webp:smic.webp" \
  "TexasInstruments-Logo.svg.webp:texas-instruments.webp" "GlobalFoundries_logo.svg.webp:globalfoundries.webp" \
  "UMC-Logo.svg.webp:umc.webp"; do cp "$SRC/Logo công ty/${pair%%:*}" "public/logos/${pair##*:}"; done
for pair in "AMD-Logo.png:amd.png" "Apple-Logo.png:apple.png" "Intel-logo-2022.png:intel.png"; do
  ffmpeg -v error -y -i "$SRC/Logo công ty/${pair%%:*}" -vf "scale='min(600,iw)':-2" "public/logos/${pair##*:}"; done
```

Expected: `ls public/logos` liệt kê 14 file; `du -sh public/logos` < 1 MB.

- [ ] **Step 3: Sao chép cờ/bản đồ và clip; tạo ảnh nền hero.**

```bash
C="$SRC/Quốc gia"
cp "$C/Flag_of_the_United_States.svg.webp" public/countries/usa-flag.webp
cp "$C/USA_Flag_Map.svg" public/countries/usa-map.svg
cp "$C/Flag_of_the_Republic_of_China.svg.webp" public/countries/taiwan-flag.webp
cp "$C/Flag_Map_of_Taiwan_(Republic_of_China).png" public/countries/taiwan-map.png
cp "$C/Flag_of_the_People_s_Republic_of_China.svg.webp" public/countries/china-flag.webp
cp "$C/Flag-map_of_the_People_s_Republic_of_China.svg.webp" public/countries/china-map.webp
cp "$C/Flag_of_South_Korea.svg.webp" public/countries/south-korea-flag.webp
cp "$C/Flag-map_of_South_Korea.svg" public/countries/south-korea-map.svg
cp "$C/Flag_of_the_Netherlands.svg.webp" public/countries/netherlands-flag.webp
cp "$C/Flag-map_of_the_Netherlands.svg.webp" public/countries/netherlands-map.webp
for f in hero-intro asml-part1 asml-part2 asml-part3 asml-part4 tsmc-open; do cp "/tmp/claude-501/vid/out/$f.mp4" public/video/; done
# hero backdrop: circuit-board image from the plan document, 1920px, JPEG q72
ffmpeg -v error -y -i "$SRC/wallpapersden.com_cool-circuit-hd-motherboard_1920x1080.jpg" -vf "scale=1920:-2" -q:v 6 public/hero-backdrop.jpg
```

Expected: `du -sh public/countries public/video/hero-intro.mp4 public/hero-backdrop.jpg` — countries < 1.5 MB, backdrop < 600 KB. Nếu `wallpapersden…jpg` khác ảnh trong docx (`word/media/image19.jpg`), so sánh bằng mắt và dùng ảnh trong docx.

- [ ] **Step 4: Kiểm tra.** `for f in public/video/*.mp4; do ffprobe -v error -show_entries stream=codec_name,width,height -of csv=p=0 "$f"; done` → `h264` 1280x720 (không có stream audio). Mỗi file ≤ 5 MB (`ls -l`).

- [ ] **Step 5: Checkpoint.** `git add public/logos public/countries public/video/hero-intro.mp4 public/video/asml-part*.mp4 public/video/tsmc-open.mp4 public/hero-backdrop.jpg` rồi `git commit -m "feat(assets): add company logos, country flags and maps, real intro clips"` (chỉ commit khi chủ dự án đã cho phép commit trên nhánh này).

---

### Task 2: `youtubeClipEmbedUrl` (TDD)

**Files:**
- Modify: `src/lib/video.ts` (thêm sau `embedUrl`)
- Test: `src/lib/video.test.ts`

**Interfaces:**
- Produces: `youtubeClipEmbedUrl(id: string, startSeconds: number, endSeconds: number): string | null` — `null` khi id sai định dạng, `startSeconds < 0`, `endSeconds <= startSeconds`, hoặc không phải số nguyên hữu hạn.

- [ ] **Step 1: Viết test lỗi.** Thêm vào `src/lib/video.test.ts` (giữ nguyên import hiện có, thêm `youtubeClipEmbedUrl`):

```ts
describe("youtubeClipEmbedUrl", () => {
  it("builds a privacy-enhanced embed with start and end", () => {
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", 60, 90)).toBe(
      "https://www.youtube-nocookie.com/embed/xaspX81mfzQ?start=60&end=90&rel=0&modestbranding=1&autoplay=1"
    );
  });

  it("refuses a malformed id", () => {
    expect(youtubeClipEmbedUrl("not an id", 0, 10)).toBeNull();
    expect(youtubeClipEmbedUrl("../x", 0, 10)).toBeNull();
  });

  it("refuses an empty, reversed or negative window", () => {
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", 10, 10)).toBeNull();
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", 30, 10)).toBeNull();
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", -1, 10)).toBeNull();
  });

  it("refuses non-integer or non-finite times", () => {
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", 1.5, 10)).toBeNull();
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", 0, Number.NaN)).toBeNull();
    expect(youtubeClipEmbedUrl("xaspX81mfzQ", 0, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL.** `npx vitest run src/lib/video.test.ts` → lỗi `youtubeClipEmbedUrl is not a function`.

- [ ] **Step 3: Cài đặt tối thiểu** (`src/lib/video.ts`, ngay sau `embedUrl`):

```ts
/**
 * Embed address for a fixed window of a YouTube video. Returns null instead of
 * a broken address when the id or the window is unusable, so a bad constant
 * shows nothing rather than a dead player.
 */
export function youtubeClipEmbedUrl(
  id: string,
  startSeconds: number,
  endSeconds: number
): string | null {
  if (!YOUTUBE_ID.test(id)) return null;
  if (!Number.isInteger(startSeconds) || !Number.isInteger(endSeconds)) return null;
  if (startSeconds < 0 || endSeconds <= startSeconds) return null;
  return `${embedUrl({ platform: "youtube", externalId: id })}?start=${startSeconds}&end=${endSeconds}&rel=0&modestbranding=1&autoplay=1`;
}
```

- [ ] **Step 4: Chạy, xác nhận PASS.** `npx vitest run src/lib/video.test.ts`.

- [ ] **Step 5: Checkpoint.** `git add src/lib/video.ts src/lib/video.test.ts` → `git commit -m "feat(video): build bounded YouTube clip embed URLs"`.

---

### Task 3: Chọn và ghi mốc video 5 nước (cần chủ dự án duyệt)

**Files:**
- Create: `src/lib/country-clips.ts`

**Interfaces:**
- Produces: `COUNTRY_CLIPS: Record<"usa" | "taiwan" | "china" | "south-korea" | "netherlands", { youtubeId: string; start: number; end: number }>`; ID nguồn: usa `xaspX81mfzQ`, taiwan `WKHKy89QaV0`, china `8ekndZwyOzo`, south-korea `8JiyJejo-e0`, netherlands `h_zgURwr6nA`.

- [ ] **Step 1: Lấy phụ đề để tìm đoạn không có người nói.** Với mỗi id:

```bash
mkdir -p "$TMPDIR/clips" && yt-dlp --no-warnings -q --skip-download --write-auto-subs --sub-langs "en.*" --sub-format vtt -o "$TMPDIR/clips/%(id)s" "https://www.youtube.com/watch?v=<ID>"
```
Tìm khoảng ≥ 20 giây liên tục không có dòng thoại trong file `.vtt` (khoảng trống giữa hai cue). Nếu YouTube trả 429, chờ và thử lại, hoặc chọn theo khung hình.

- [ ] **Step 2: Kiểm tra bằng khung hình.** Cho mỗi ứng viên, tải đúng đoạn (`yt-dlp --download-sections "*START-END" -f "bv*[height<=480]"`) rồi trích 1 khung/5 giây bằng `ffmpeg -vf fps=1/5,scale=480:-2` và xem bằng `Read`. Loại đoạn có người nói trước ống kính hoặc chữ chèn (lower-third) che nhiều màn hình. Ưu tiên đoạn dây chuyền sản xuất/máy móc.
  Riêng Hà Lan (`h_zgURwr6nA`, dài 1:39) chọn đoạn 20–30 giây.

- [ ] **Step 3: Chủ dự án duyệt.** Dùng `AskUserQuestion` (hoặc gửi ảnh contact sheet) cho từng nước: mốc đề xuất + 3 khung hình. Chỉ ghi vào code khi chủ dự án đồng ý.

- [ ] **Step 4: Ghi file** `src/lib/country-clips.ts` với số đã duyệt (mỗi entry có `end - start` từ 15 đến 45 giây):

```ts
/**
 * Approved YouTube windows for the country bands. Chosen so no presenter is on
 * screen and the footage shows the production process. Each `youtubeId` is the
 * original channel's video; we embed it, never copy it.
 */
export const COUNTRY_CLIPS = {
  usa: { youtubeId: "xaspX81mfzQ", start: 0, end: 0 },
  taiwan: { youtubeId: "WKHKy89QaV0", start: 0, end: 0 },
  china: { youtubeId: "8ekndZwyOzo", start: 0, end: 0 },
  "south-korea": { youtubeId: "8JiyJejo-e0", start: 0, end: 0 },
  netherlands: { youtubeId: "h_zgURwr6nA", start: 0, end: 0 },
} as const satisfies Record<string, { youtubeId: string; start: number; end: number }>;
```
Thay các `0` bằng mốc đã duyệt ở Step 3; test ở Task 4 sẽ FAIL nếu còn `start: 0, end: 0`, nên không thể bỏ sót.

- [ ] **Step 5: Checkpoint.** `git add src/lib/country-clips.ts` → `git commit -m "feat(countries): record approved YouTube windows for each country"`.

---

### Task 4: Dữ liệu `COUNTRY_BANDS`, Ecosystem và test dữ liệu (TDD)

**Files:**
- Modify: `src/lib/constants.ts` (thay khối `COUNTRY_BANDS` và `CountryBand`, dòng ~92–135)
- Test: `src/lib/constants.test.ts` (mới)

**Interfaces:**
- Consumes: `COUNTRY_CLIPS` (Task 3), `youtubeClipEmbedUrl` (Task 2).
- Produces:
  - `type CountryCompany = { name: string; logo: string | null; href: string }`
  - `type CountryBand = { id: CountryId; labelKey: CountryId; tone: string; flag: string; map: string; companies: readonly CountryCompany[]; clip: (typeof COUNTRY_CLIPS)[CountryId] }`
  - `COUNTRY_BANDS: readonly CountryBand[]` (thứ tự: usa, taiwan, china, south-korea, netherlands)
  - `ECOSYSTEM_GROUPS: readonly { id: "equipment" | "foundries" | "idm" | "fabless" | "osat"; items: readonly { name: string; logo: string | null }[] }[]`

- [ ] **Step 1: Viết test lỗi** `src/lib/constants.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COUNTRY_BANDS, ECOSYSTEM_GROUPS } from "@/lib/constants";
import { youtubeClipEmbedUrl } from "@/lib/video";

const publicFile = (p: string) => existsSync(join(process.cwd(), "public", p));

describe("COUNTRY_BANDS", () => {
  it("lists the five countries in the agreed order", () => {
    expect(COUNTRY_BANDS.map((b) => b.id)).toEqual([
      "usa", "taiwan", "china", "south-korea", "netherlands",
    ]);
  });

  it("gives every country a usable video window", () => {
    for (const band of COUNTRY_BANDS) {
      const { youtubeId, start, end } = band.clip;
      expect(youtubeClipEmbedUrl(youtubeId, start, end), band.id).not.toBeNull();
      expect(end - start, band.id).toBeGreaterThanOrEqual(15);
    }
  });

  it("points every company at an https website, opened externally", () => {
    for (const band of COUNTRY_BANDS) {
      expect(band.companies.length, band.id).toBeGreaterThan(0);
      for (const company of band.companies) {
        expect(new URL(company.href).protocol, company.name).toBe("https:");
      }
    }
  });

  it("only references flag, map and logo files that exist", () => {
    for (const band of COUNTRY_BANDS) {
      expect(publicFile(band.flag), band.flag).toBe(true);
      expect(publicFile(band.map), band.map).toBe(true);
      for (const company of band.companies) {
        if (company.logo) expect(publicFile(company.logo), company.logo).toBe(true);
      }
    }
  });

  it("keeps a text fallback for companies without a logo (Micron)", () => {
    const micron = COUNTRY_BANDS.flatMap((b) => b.companies).find((c) => c.name === "Micron");
    expect(micron?.logo).toBeNull();
  });
});

describe("ECOSYSTEM_GROUPS", () => {
  it("covers the five roles once each", () => {
    expect(ECOSYSTEM_GROUPS.map((g) => g.id)).toEqual([
      "equipment", "foundries", "idm", "fabless", "osat",
    ]);
  });

  it("only references logo files that exist", () => {
    for (const group of ECOSYSTEM_GROUPS)
      for (const item of group.items)
        if (item.logo) expect(publicFile(item.logo), item.logo).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL.** `npx vitest run src/lib/constants.test.ts` (fail vì `clip`, `flag`… chưa có).

- [ ] **Step 3: Cài đặt.** Thay khối `COUNTRY_BANDS` … `CountryBand` trong `src/lib/constants.ts` bằng:

```ts
import { COUNTRY_CLIPS } from "@/lib/country-clips";

export type CountryId = keyof typeof COUNTRY_CLIPS;
export type CountryCompany = { name: string; logo: string | null; href: string };

// Bands are told apart by shade, never hue (see TOPIC_TONE). `logo: null`
// renders the name as text: Micron's logo is not in the shared drive yet.
export const COUNTRY_BANDS = [
  {
    id: "usa", labelKey: "usa", tone: "#CDCDCD",
    flag: "/countries/usa-flag.webp", map: "/countries/usa-map.svg",
    companies: [
      { name: "NVIDIA", logo: "/logos/nvidia.webp", href: "https://www.nvidia.com" },
      { name: "Broadcom", logo: "/logos/broadcom.webp", href: "https://www.broadcom.com" },
      { name: "AMD", logo: "/logos/amd.png", href: "https://www.amd.com" },
      { name: "Micron", logo: null, href: "https://www.micron.com" },
      { name: "Qualcomm", logo: "/logos/qualcomm.webp", href: "https://www.qualcomm.com" },
      { name: "Intel", logo: "/logos/intel.png", href: "https://www.intel.com" },
    ],
    clip: COUNTRY_CLIPS.usa,
  },
  {
    id: "taiwan", labelKey: "taiwan", tone: "#D3D3D3",
    flag: "/countries/taiwan-flag.webp", map: "/countries/taiwan-map.png",
    companies: [{ name: "TSMC", logo: "/logos/tsmc.webp", href: "https://www.tsmc.com" }],
    clip: COUNTRY_CLIPS.taiwan,
  },
  {
    id: "china", labelKey: "china", tone: "#DADADA",
    flag: "/countries/china-flag.webp", map: "/countries/china-map.webp",
    companies: [{ name: "SMIC", logo: "/logos/smic.webp", href: "https://www.smics.com" }],
    clip: COUNTRY_CLIPS.china,
  },
  {
    id: "south-korea", labelKey: "south-korea", tone: "#E3E3E3",
    flag: "/countries/south-korea-flag.webp", map: "/countries/south-korea-map.svg",
    companies: [
      { name: "Samsung", logo: "/logos/samsung.svg", href: "https://www.samsung.com" },
      { name: "SK hynix", logo: "/logos/sk-hynix.webp", href: "https://www.skhynix.com" },
    ],
    clip: COUNTRY_CLIPS["south-korea"],
  },
  {
    id: "netherlands", labelKey: "netherlands", tone: "#EEEEEE",
    flag: "/countries/netherlands-flag.webp", map: "/countries/netherlands-map.webp",
    companies: [{ name: "ASML", logo: "/logos/asml.webp", href: "https://www.asml.com" }],
    clip: COUNTRY_CLIPS.netherlands,
  },
] as const satisfies readonly {
  id: CountryId; labelKey: CountryId; tone: string; flag: string; map: string;
  companies: readonly CountryCompany[]; clip: (typeof COUNTRY_CLIPS)[CountryId];
}[];

export type CountryBand = (typeof COUNTRY_BANDS)[number];

/** Roles in the chip supply chain for the Ecosystem diagram. Names without a
 *  logo file are drawn as text. */
export const ECOSYSTEM_GROUPS = [
  { id: "equipment", items: [
    { name: "ASML", logo: "/logos/asml.webp" }, { name: "Applied Materials", logo: null },
    { name: "Lam Research", logo: null }, { name: "KLA", logo: null },
    { name: "Tokyo Electron", logo: null }, { name: "Axcelis", logo: null },
    { name: "ChipMOS", logo: null },
  ] },
  { id: "foundries", items: [
    { name: "TSMC", logo: "/logos/tsmc.webp" }, { name: "GlobalFoundries", logo: "/logos/globalfoundries.webp" },
    { name: "Texas Instruments", logo: "/logos/texas-instruments.webp" },
    { name: "SMIC", logo: "/logos/smic.webp" }, { name: "UMC", logo: "/logos/umc.webp" },
  ] },
  { id: "idm", items: [
    { name: "Intel", logo: "/logos/intel.png" }, { name: "Samsung", logo: "/logos/samsung.svg" },
  ] },
  { id: "fabless", items: [
    { name: "NVIDIA", logo: "/logos/nvidia.webp" }, { name: "Apple", logo: "/logos/apple.png" },
    { name: "Qualcomm", logo: "/logos/qualcomm.webp" }, { name: "Broadcom", logo: "/logos/broadcom.webp" },
    { name: "AMD", logo: "/logos/amd.png" },
  ] },
  { id: "osat", items: [
    { name: "Amkor", logo: null }, { name: "ASE", logo: null }, { name: "SPIL", logo: null },
  ] },
] as const;
```

(Đưa `import { COUNTRY_CLIPS }` lên đầu file cùng các import khác.)

- [ ] **Step 4: Chạy, xác nhận PASS.** `npx vitest run src/lib/constants.test.ts && npm run typecheck`.

- [ ] **Step 5: Checkpoint.** `git add src/lib/constants.ts src/lib/constants.test.ts` → `git commit -m "feat(countries): model five country bands with flags, maps, logos and clips"`.

---

### Task 5: Chuỗi song ngữ

**Files:**
- Modify: `src/messages/vi.json`, `src/messages/en.json`
- Test: `src/messages/keys-parity.test.ts` (đã có)

**Interfaces:**
- Produces khoá: `countries.china`; `home.countries.playVideo` (`{country}`), `home.countries.openSite` (`{company}`), `home.countries.videoTitle` (`{country}`); `home.ecosystem.{headline,description,note}`; `home.ecosystem.groups.{equipment,foundries,idm,fabless,osat}`; `home.ecosystem.groupHints.{…}`.

- [ ] **Step 1: Thêm vào `vi.json`** — trong `countries` thêm `"china": "Trung Quốc"`; trong `home.countries` thêm `"playVideo": "Xem video về {country}"`, `"openSite": "Mở website của {company} (tab mới)"`, `"videoTitle": "Video giới thiệu ngành bán dẫn tại {country}"`; thêm khối `home.ecosystem`:

```json
"ecosystem": {
  "headline": "Ai làm gì trong chuỗi cung ứng chip?",
  "description": "Một con chip cần nhiều loại công ty cùng làm việc: người chế tạo máy móc, người thiết kế, người sản xuất và người đóng gói.",
  "groups": {
    "equipment": "Thiết bị",
    "foundries": "Nhà máy đúc chip (Foundry)",
    "idm": "Vừa thiết kế vừa sản xuất (IDM)",
    "fabless": "Chỉ thiết kế (Fabless)",
    "osat": "Đóng gói và kiểm thử (OSAT)"
  },
  "groupHints": {
    "equipment": "Chế tạo máy móc để làm ra chip",
    "foundries": "Sản xuất chip theo thiết kế của người khác",
    "idm": "Tự thiết kế và tự sản xuất",
    "fabless": "Thiết kế chip, thuê nơi khác sản xuất",
    "osat": "Cắt, đóng gói và kiểm tra chip thành phẩm"
  },
  "note": "Sơ đồ do dự án vẽ lại để minh hoạ; tên và logo thuộc về các công ty tương ứng."
}
```

- [ ] **Step 2: Thêm bản tiếng Anh tương ứng vào `en.json`** cùng cấu trúc, cùng khoá:
  `countries.china` = "China"; `playVideo` = "Watch the video about {country}"; `openSite` = "Open {company}'s website (new tab)"; `videoTitle` = "Video about the semiconductor industry in {country}"; `ecosystem.headline` = "Who does what in the chip supply chain?"; `description` = "One chip takes many kinds of companies: those who build the machines, design, manufacture and package it."; `groups` = Equipment / Foundries / Integrated makers (IDM) / Design only (Fabless) / Packaging and testing (OSAT); `groupHints` = "Builds the machines that make chips" / "Manufactures chips designed by others" / "Designs and manufactures its own chips" / "Designs chips, hires others to make them" / "Cuts, packages and tests finished chips"; `note` = "Diagram redrawn by the project for illustration; names and logos belong to their respective companies."

- [ ] **Step 3: Chạy.** `npx vitest run src/messages` → PASS (parity).

- [ ] **Step 4: Checkpoint.** `git add src/messages` → `git commit -m "feat(i18n): add strings for the China band and the ecosystem diagram"`.

---

### Task 6: `CountryVideo` + `CountryBands` mới

**Files:**
- Create: `src/components/sections/CountryVideo.tsx`
- Modify: `src/components/sections/CountryBands.tsx` (viết lại)

**Interfaces:**
- Consumes: `COUNTRY_BANDS`/`CountryBand`, `youtubeClipEmbedUrl`, khoá i18n Task 5, `EASE_STANDARD` từ `@/components/motion`.
- Produces: `CountryVideo({ clip, title, playLabel }: { clip: CountryBand["clip"]; title: string; playLabel: string })`; `CountryBands()` giữ nguyên chữ ký (không props).

- [ ] **Step 1: Viết `CountryVideo`** — facade dùng thumbnail YouTube (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`); bấm mới dựng iframe. Kiểm tra `img-src` trong CSP `next.config.mjs` cho phép `i.ytimg.com`; nếu chưa, thêm host đó vào `img-src` (một dòng) và ghi vào commit.

```tsx
"use client";

import { useState } from "react";
import type { CountryBand } from "@/lib/constants";
import { youtubeClipEmbedUrl } from "@/lib/video";

/** Click-to-play: no iframe (and no request to YouTube) until the reader asks. */
export function CountryVideo({
  clip,
  title,
  playLabel,
}: {
  clip: CountryBand["clip"];
  title: string;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src = youtubeClipEmbedUrl(clip.youtubeId, clip.start, clip.end);
  if (!src) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/80">
      {playing ? (
        <iframe
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={playLabel}
          className="group absolute inset-0 grid place-items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span aria-hidden className="relative grid size-12 place-items-center rounded-full bg-white/90 text-black">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Viết lại `CountryBandRow` và `CountryBands`.** Bố cục: hàng `md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]`; cột trái gồm cờ + bản đồ chồng nhau (cờ `absolute` sau, bản đồ đè lên, `mix-blend-multiply`), tên nước, danh sách công ty. Danh sách công ty: mặc định thu gọn (`max-h-0 opacity-0`) và mở khi `group-hover`, `group-focus-within`, hoặc trên màn hình không có hover (`@media (hover: none)`) thì luôn mở. Quan trọng: dùng class Tailwind `[@media(hover:none)]:max-h-40 [@media(hover:none)]:opacity-100` và `motion-reduce:transition-none`. Mỗi công ty là `<a href target="_blank" rel="noopener noreferrer" aria-label={t("openSite",{company})}>` chứa `<img>` (nếu có `logo`) hoặc tên chữ. Bên phải: `<CountryVideo …/>`. Giữ `motion.div` xuất hiện dần như file cũ (`EASE_STANDARD`, `useReducedMotion`), bỏ hiệu ứng lớp phủ `hovered` nếu không còn dùng (xoá `useState` thừa). Cấu trúc chính:

```tsx
<motion.div className="group relative overflow-hidden rounded-2xl border border-black/[0.06]" style={{ background: band.tone }} ...>
  <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-center">
    <div className="relative min-h-[7rem]">
      <div aria-hidden className="absolute inset-y-0 left-0 w-40 sm:w-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={band.flag} alt="" loading="lazy" className="absolute left-0 top-1/2 h-16 -translate-y-1/2 rounded-md object-cover shadow-sm" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={band.map} alt="" loading="lazy" className="absolute left-10 top-1/2 h-24 -translate-y-1/2 object-contain opacity-90 mix-blend-multiply" />
      </div>
      <div className="relative pl-44 sm:pl-56">
        <h3 className="text-[26px] font-extrabold uppercase leading-none tracking-[-0.02em] text-text/90 sm:text-[32px]">{t(band.labelKey)}</h3>
        <ul className="mt-3 flex max-h-0 flex-wrap gap-2 overflow-hidden opacity-0 transition-all duration-300 motion-reduce:transition-none group-focus-within:max-h-40 group-focus-within:opacity-100 group-hover:max-h-40 group-hover:opacity-100 [@media(hover:none)]:max-h-40 [@media(hover:none)]:opacity-100">
          {band.companies.map((c) => (
            <li key={c.name}>
              <a href={c.href} target="_blank" rel="noopener noreferrer" aria-label={tc("openSite", { company: c.name })}
                 className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white/80 px-3.5 text-sm font-semibold text-text/80 hover:bg-white">
                {c.logo ? <img src={c.logo} alt={c.name} loading="lazy" className="h-4 w-auto" /> : c.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <CountryVideo clip={band.clip} title={tc("videoTitle", { country: t(band.labelKey) })} playLabel={tc("playVideo", { country: t(band.labelKey) })} />
  </div>
</motion.div>
```
với `const t = useTranslations("countries"); const tc = useTranslations("home.countries");` (chú thích eslint-disable trước từng `<img>` như file hiện tại). Tên nước luôn hiện (không phụ thuộc hover); chỉ danh sách công ty ẩn/hiện.

- [ ] **Step 3: Chạy kiểm tra tĩnh.** `npm run typecheck && npm run lint` → 0 lỗi.

- [ ] **Step 4: Kiểm tra trình duyệt** (`NODE_ENV=development npx next dev`, không chạy build cùng lúc). Ở 1280px và 375px: (a) hover một dải → hiện logo; (b) Tab bằng bàn phím → logo hiện khi focus; (c) 375px hoặc giả lập `hover: none` → logo luôn hiện; (d) bấm ▶ → iframe dựng đúng `start`/`end`, trước đó `document.querySelectorAll('#countries iframe').length === 0`; (e) bật "Reduce motion" trong DevTools → không có chuyển động; (f) `checkVisibility()` cho danh sách logo sau hover. Chụp ảnh gửi chủ dự án.

- [ ] **Step 5: Checkpoint.** `git add src/components/sections/CountryVideo.tsx src/components/sections/CountryBands.tsx next.config.mjs` → `git commit -m "feat(countries): compact bands with hover logos, flag and map, embedded clip"`.

---

### Task 7: Sơ đồ Ecosystem + trang chủ

**Files:**
- Create: `src/components/sections/EcosystemDiagram.tsx`
- Modify: `src/app/[locale]/page.tsx` (đặt ngay trước `<CountryBands />`)

**Interfaces:**
- Consumes: `ECOSYSTEM_GROUPS`, khoá `home.ecosystem.*`, `SectionHeading` (props `namespace`, `titleKey`, `descriptionKey` như `CountryBands`).
- Produces: `EcosystemDiagram()` server component, không props.

- [ ] **Step 1: Viết component** (server component, dùng `getTranslations`). Bố cục gốc do dự án thiết kế, không sao chép sơ đồ của bên thứ ba: hàng trên "Thiết bị" (full width); giữa ba cột Foundry | IDM | Fabless (IDM ở giữa, nhấn mạnh bằng viền đậm để thể hiện nó nằm giữa hai nhóm); hàng dưới OSAT. Mỗi nhóm là thẻ có `<h3>`, dòng mô tả `groupHints`, danh sách `<ul>` logo hoặc tên chữ. Không hover-only. Khối bọc `<section id="ecosystem" aria-label={t("headline")}>`.

```tsx
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { ECOSYSTEM_GROUPS } from "@/lib/constants";

const area: Record<string, string> = {
  equipment: "md:col-span-3",
  foundries: "md:col-span-1",
  idm: "md:col-span-1 md:border-2 md:border-text/30",
  fabless: "md:col-span-1",
  osat: "md:col-span-3",
};

export async function EcosystemDiagram() {
  const t = await getTranslations("home.ecosystem");
  return (
    <section id="ecosystem" aria-label={t("headline")} className="px-5 pt-16 md:px-8 md:pt-24">
      <div className="mx-auto w-full max-w-content">
        <SectionHeading namespace="home.ecosystem" titleKey="headline" descriptionKey="description" />
        <div className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3">
          {ECOSYSTEM_GROUPS.map((group) => (
            <div key={group.id} className={`rounded-2xl border border-black/[0.08] bg-white/70 p-5 ${area[group.id]}`}>
              <h3 className="text-lg font-extrabold tracking-[-0.01em] text-text">{t(`groups.${group.id}`)}</h3>
              <p className="mt-1 text-sm text-text-muted">{t(`groupHints.${group.id}`)}</p>
              <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                {group.items.map((item) => (
                  <li key={item.name} className="flex h-8 items-center text-sm font-semibold text-text/80">
                    {item.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.logo} alt={item.name} loading="lazy" className="h-6 w-auto max-w-[7rem] object-contain" />
                    ) : (
                      item.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-text-muted">{t("note")}</p>
      </div>
    </section>
  );
}
```
Kiểm tra `SectionHeading` nhận đúng props này (mở `SectionHeading.tsx`); nếu chữ ký khác, theo chữ ký thật. Thứ tự DOM: equipment, foundries, idm, fabless, osat — đúng thứ tự đọc.

- [ ] **Step 2: Gắn vào trang chủ.** Trong `src/app/[locale]/page.tsx` thêm `import { EcosystemDiagram } from "@/components/sections/EcosystemDiagram";` và render `<EcosystemDiagram />` ngay trước `<CountryBands />`.

- [ ] **Step 3: Kiểm tra.** `npm run typecheck && npm run lint`; mở `/` ở 375px và 1280px, xác nhận không cuộn ngang, logo thấy rõ, tab đọc theo thứ tự.

- [ ] **Step 4: Checkpoint.** `git add src/components/sections/EcosystemDiagram.tsx src/app` → `git commit -m "feat(home): add a redrawn supply-chain ecosystem diagram"`.

---

### Task 8: Hero, video giới thiệu, 4 clip chủ đề, ảnh nền

**Files:**
- Modify: `src/lib/constants.ts` (`HOME_VIDEO`, `HOME_VIDEO_CREDIT`, `TOPIC_VIDEOS`, `HERO_BACKDROP`, chú thích PLACEHOLDER)
- Modify: `src/components/sections/Hero.tsx` (khoảng cách chữ/tên)
- Modify: `src/components/motion/StickyBackdrop.tsx` không đổi; làm mờ bằng class ở nơi gọi.

**Interfaces:**
- Consumes: file Task 1.
- Produces: `HOME_VIDEO = "/video/hero-intro.mp4"`, `HERO_BACKDROP = "/hero-backdrop.jpg"`, `TOPIC_VIDEOS` (4 khoá `TopicId`).

- [ ] **Step 1: Cập nhật hằng số.**

```ts
export const HOME_VIDEO = "/video/hero-intro.mp4";
export const HOME_VIDEO_CREDIT: { label: string; href: string } | null = {
  label: "The Closest Thing We Have to Alien Technology",
  href: "https://www.youtube.com/watch?v=MiUHjLxm3V0",
};
export const TOPIC_VIDEOS: Record<TopicId, string> = {
  "dinh-nghia": "/video/asml-part1.mp4",
  "nguyen-ly": "/video/asml-part2.mp4",
  "ung-dung": "/video/asml-part3.mp4",
  "lich-su": "/video/asml-part4.mp4",
};
export const HERO_BACKDROP = "/hero-backdrop.jpg";
```
Cập nhật/xoá các khối chú thích "PLACEHOLDER" tương ứng (giữ chú thích WHY: clip ASML dùng cho phần nội dung, video nguồn ghi ở credit). Trong `LessonTopics.tsx` xác nhận không cần đổi (chỉ đọc `TOPIC_VIDEOS`); thêm credit ASML dưới cột video nếu `LessonTopics` có chỗ cho credit (không thì ghi credit ASML trong `home.videos` note — quyết định khi đọc file, giữ thay đổi nhỏ nhất).

- [ ] **Step 2: Làm mờ ảnh nền và giãn tên.** Ở `page.tsx`: `<StickyBackdrop src={HERO_BACKDROP} className="[&_img]:scale-105 [&_img]:blur-[6px] [&_img]:opacity-40" />` (điều chỉnh cho chữ Hero vẫn đạt tương phản ≥ 4.5:1; đo bằng DevTools). Ở `Hero.tsx`: tăng khoảng cách giữa các từ/tên bị dính (`tracking-[-0.03em]`→`tracking-[-0.01em]` và/hoặc `gap-x-*` ở dòng tiêu đề) — mở ảnh docx `image52.png` (`/tmp/claude-501/m/word/media/image52.png`) để đối chiếu chỗ nào "dính", chỉ sửa đúng chỗ đó.

- [ ] **Step 3: Dọn file giữ chỗ không còn dùng.** Sau khi `grep -rn "clip-[1-6]\|intro-placeholder\|hero-backdrop.svg" src` chỉ còn `CAROUSEL_VIDEOS` dùng `clip-1..6.mp4`: **giữ nguyên** `clip-1..6.mp4` (carousel vẫn giữ chỗ, spec §4); chỉ xoá `public/video/intro-placeholder.mp4` và `public/hero-backdrop.svg` nếu không còn tham chiếu. Xoá từng file có tên rõ, không xoá hàng loạt; hỏi chủ dự án trước khi xoá.

- [ ] **Step 4: Kiểm tra.** `npm run typecheck && npm run lint && npm test`. Trình duyệt: `/` → video hero chạy đúng ~29s, dừng ở câu "…the faster they can compute"; ảnh nền mờ, chữ đọc rõ; 4 clip đổi khi mở từng chủ đề.

- [ ] **Step 5: Checkpoint.** `git add src public` (các file đã sửa/xoá đích danh) → `git commit -m "feat(home): real intro and topic clips, blurred circuit backdrop, roomier hero title"`.

---

### Task 9: Blog (clip TSMC) và banner About/Video

**Files:**
- Modify: `src/app/[locale]/blog/page.tsx`, `src/app/[locale]/video/page.tsx`, `src/app/[locale]/gioi-thieu/page.tsx`, `src/lib/constants.ts` (`ABOUT_BANNER`, thêm `VIDEO_BANNER`, `BLOG_CLIP`)
- Create: `public/about-banner.jpg`, `public/video-banner.jpg`

**Interfaces:**
- Produces: `BLOG_CLIP = "/video/tsmc-open.mp4"`, `VIDEO_BANNER = "/video-banner.jpg"`, `ABOUT_BANNER` trỏ ảnh mới.

- [ ] **Step 1: Chọn ảnh.** About: `Siltronic_Nadine_Bartzsch_PSD_9449.jpg` (kỹ sư phòng sạch). Video: `Halbleiterfertigung_res_1984x1116.webp`. Nén về rộng 1600px, JPEG q72, mỗi ảnh < 400 KB:

```bash
SRC="/Users/nmh/Downloads/drive-download-20260929T080849Z-1-001"
ffmpeg -v error -y -i "$SRC/Siltronic_Nadine_Bartzsch_PSD_9449.jpg" -vf "scale=1600:-2" -q:v 6 public/about-banner.jpg
ffmpeg -v error -y -i "$SRC/Halbleiterfertigung_res_1984x1116.webp" -vf "scale=1600:-2" -q:v 6 public/video-banner.jpg
```
Chủ dự án có thể đổi ảnh khác; chỉ là hằng số. Ghi nguồn/quyền ảnh cho chủ dự án xác nhận (Siltronic là ảnh báo chí của công ty đó).

- [ ] **Step 2: Cập nhật hằng số và trang.** `ABOUT_BANNER = "/about-banner.jpg"`; thêm `VIDEO_BANNER`, `BLOG_CLIP`. Trên trang Video và Blog dùng cùng cách dựng banner như trang About (mở `gioi-thieu/page.tsx` quanh dòng 59 và làm theo mẫu đó, không tạo component mới). Trang Blog: thêm `<video src={BLOG_CLIP} autoPlay muted loop playsInline aria-hidden />` phía sau tiêu đề qua `AutoplayVideo` đã có (`src/components/ui/AutoplayVideo.tsx`), tôn trọng reduced-motion theo cách `AutoplayVideo` đang làm.

- [ ] **Step 3: Kiểm tra.** `npm run typecheck && npm run lint`; xem `/blog`, `/video`, `/gioi-thieu` ở 375px và 1280px; văn bản trên ảnh đạt tương phản.

- [ ] **Step 4: Checkpoint.** `git add public/about-banner.jpg public/video-banner.jpg src` → `git commit -m "feat(pages): image banners for About and Video, TSMC clip on Blog"`. Xoá `public/about-banner.png` chỉ sau khi xác nhận không còn tham chiếu.

---

### Task 10: Kiểm chứng toàn bộ và cập nhật bàn giao

**Files:**
- Modify: `docs/BAN-GIAO.md`, `README.md` (mục "Nội dung cần thay trước khi ra mắt" nếu có mô tả logo/video giữ chỗ)

- [ ] **Step 1: Cổng chất lượng.** Dừng mọi `next dev`/`next start`, rồi chạy: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`. Kỳ vọng: 0 lỗi, mọi test xanh (số test tăng so với 354). Nếu có gì đỏ, sửa nguyên nhân gốc, không tắt kiểm tra.

- [ ] **Step 2: Kiểm tra bảo mật.** `grep -rn "target=\"_blank\"" src/components/sections` → mọi link có `rel="noopener noreferrer"`; `grep -n "frame-src\|img-src" next.config.mjs` → chỉ thêm `i.ytimg.com` cho `img-src` nếu cần; không có key/secret trong diff (`git diff --cached | grep -i "key\|secret"`).

- [ ] **Step 3: Cập nhật `BAN-GIAO.md`.** Mục 2: thêm đợt "Second fix"; mục 6 và 7: xoá các mục đã xong (video hero/clip giữ chỗ, logo công ty), nêu còn lại: logo Micron, carousel 6 video còn giữ chỗ, xin phép/ghi nguồn clip tự host, bản sạch logo ASML. Cập nhật số test thật. Không đổi các phần khác.

- [ ] **Step 4: Báo cáo.** Gửi chủ dự án ảnh chụp trang chủ (1280px và 375px), bảng mốc video đã duyệt, và danh sách việc họ cần làm (logo Micron, xin phép kênh video, duyệt ảnh banner). Push và merge do chủ dự án quyết định.

- [ ] **Step 5: Checkpoint.** `git add docs README.md` → `git commit -m "docs: record the country bands, ecosystem diagram and real clips"`.

---

## Self-Review

**Spec coverage:** §3.1 Hero → Task 8 (video, credit, backdrop, spacing, 4 clip). §3.2 Ecosystem → Tasks 4, 5, 7. §3.3 Dải quốc gia → Tasks 1, 3–6. §3.4 Blog/banners → Task 9; xoá placeholder → Task 8 Step 3 (giữ carousel theo §4). §5 ràng buộc → Global Constraints + Task 6/10 kiểm tra. §7 việc còn mở: (1) ảnh nền → Task 1 Step 3 + Task 8; (2) mốc video → Task 3; (3) Micron/ASML logo → Task 1 (ASML có, Micron `logo: null`); (4) xin phép → Task 10 Step 4.
**Placeholders:** duy nhất `start: 0, end: 0` ở Task 3 Step 4 là giá trị phải điền sau khi chủ dự án duyệt; test Task 4 chặn nếu bỏ sót (`end - start >= 15`).
**Type consistency:** `CountryBand["clip"]`, `CountryId`, `COUNTRY_CLIPS` dùng thống nhất ở Tasks 3, 4, 6; `youtubeClipEmbedUrl` ở Tasks 2, 4, 6; khoá i18n Task 5 khớp với Task 6–7.
