# Strike Robot Landing Page — Design System Inventory

Source: `/Users/nmh/work/Mac/NMHx/CodeThue/Strike_Robot_LandingPage_Desing` (read-only, not modified).
Target for context only: `/Users/nmh/work/Mac/NMHx/CodeThue/Project_Chip_Chip`.

All paths below are relative to the Strike project root unless stated otherwise. All values are copied verbatim from the source files; grep commands used are noted so they can be re-run.

---

## 1. Colour palette

### 1.1 `tailwind.config.ts` — `theme.extend.colors` (lines 12–29)

| Token | Value | Used as a Tailwind class? |
|---|---|---|
| `bg` | `#E5E5E5` | **Unused** (grepped `bg-bg\b` — 0 hits) |
| `surface` | `#FFFFFF` | **Unused** (`bg-surface\b` / `text-surface\b` — 0 hits) |
| `surface-muted` | `#EFEFEF` | Used once: `src/components/sections/Pricing.tsx:210` (`md:bg-surface-muted`) |
| `primary` | `#0D0D0D` | **Unused** (`bg-primary\b`, `text-primary\b`, `border-primary\b` — 0 hits) |
| `accent` | `#314344` | **Unused as a class** (`bg-accent`, `text-accent`, `border-accent` — 0 hits). The same colour is used everywhere as a **literal hex string** instead: `text-[#314344]` in `src/components/sections/Hero.tsx:111`, `src/components/sections/agentic/AgenticHero.tsx:75,116`, `src/components/sections/about/AboutHero.tsx:168` (as a `from-black to-[#314344]` gradient stop). |
| `accent-teal` | `#317e6a` | **Unused as a class.** Same value appears as a literal in `src/lib/constants.ts:25` (`HERO.badge1.color`), consumed as an inline `style={{ color: badge.color }}` in `src/components/sections/Hero.tsx` (badges). |
| `accent-purple` | `#69419d` | **Unused as a class.** Same value as a literal in `src/lib/constants.ts:26` (`HERO.badge2.color`) and hardcoded again (different casing) as `#69419D` in `src/components/sections/agentic/AgenticHero.tsx:33,128` (badge icon fill + text color). |
| `text` | `#000000` | Used once: `src/app/layout.tsx:64` (`text-text` on `<body>`) |
| `text-muted` | `#3e424d` | **Unused as a class.** Same value is hardcoded everywhere instead: `text-[#3e424d]` / `text-[#3E424D]` in `Features.tsx:57,63,489`, `agentic/AgenticLayer.tsx:130,181`, `agentic/AgenticAwareness.tsx:196,203`, `agentic/AgenticOEMs.tsx:37,88`, `about/AboutPartners.tsx:48`, `Footer.tsx:59,67`, `about/AboutHero.tsx:237`. |
| `text-nav` | `#4d4d4d` | **Unused as a class.** Same value hardcoded as `text-[#4d4d4d]` in `Navbar.tsx:502` and as an SVG `stroke="#666666"` (close but not identical) in `Navbar.tsx:207`. |
| `muted` | `#6B7280` | **Unused** anywhere (no grep hits at all, not even as a literal). |
| `border` | `hsl(var(--border))` | Effectively used **globally** — see §1.2, `* { @apply border-border }` sets the default border color of every element. |
| `input` | `hsl(var(--input))` | **Unused** (no `bg-input`/`border-input` hits) |
| `ring` | `hsl(var(--ring))` | **Unused** (no `ring-ring` hits) |
| `background` | `hsl(var(--background))` | **Unused** (no `bg-background` hits) |
| `foreground` | `hsl(var(--foreground))` | **Unused** (no `text-foreground` hits) |

Grep used: `grep -rn "bg-accent\|text-accent\|border-accent\|accent-teal\|accent-purple\|bg-primary\|text-primary\|bg-bg\|bg-text\|text-text\|bg-muted\|text-muted\|bg-surface\|font-display\|glow-primary\|..." src` and targeted greps per token (see below). Also confirmed with `grep -rn "bg-background\|text-foreground\|border-border\|bg-input\|ring-ring\|bg-card\|bg-popover\|bg-destructive\|bg-secondary" src` → only hit is `globals.css:32` (`@apply border-border`).

**Conclusion: the whole named Tailwind colour-token layer in `tailwind.config.ts` is essentially decorative.** Every component in `src/components/**` paints color with literal Tailwind defaults (`black`, `white`, `black/10`, `black/15`, `white/60`, …) or literal hex (`#314344`, `#3e424d`, `#4d4d4d`, `#E6E6EB`, `#f5f5f5`, `#fafafa`, `#69419D`, `#7AA297`, `#8FA6B0`, `#0000004d`, `#CDCDCD`, `#020202`, `#0a0a0a`/`#1f1f1f` gradient, etc.) rather than the semantic names. **If porting "1:1", copy the actual hex values used in each component, not just the token names** — the token names are aspirational/unused and don't reflect what's on screen.

### 1.2 `tailwind.config.ts` — other extend blocks

- `fontFamily` (lines 30–36) — see §2.
- `backgroundImage` (lines 37–45): `gradient-radial`, `gradient-conic` (Tailwind boilerplate, unused — 0 hits for `bg-gradient-radial`/`bg-gradient-conic`), `glow-primary` = `radial-gradient(ellipse at center, rgba(108,99,255,0.12) 0%, transparent 70%)`, `glow-accent` = `radial-gradient(ellipse at center, rgba(0,153,170,0.10) 0%, transparent 70%)` — **both unused** (no `bg-glow-primary`/`bg-glow-accent` class hits).
- `boxShadow` (lines 46–51): `glow-primary`, `glow-accent`, `glow-sm`, `card`, `card-hover` — all built on the purple/teal `rgba(108,99,255,...)` / `rgba(0,153,170,...)` pair. **All unused** (no `shadow-glow-*`/`shadow-card` hits anywhere in components).
- `animation`/`keyframes` (lines 53–66): `glow-pulse` (`glowPulse 3s ease-in-out infinite`), `float` (`float 6s ease-in-out infinite`). **Both unused** (no `animate-glow-pulse`/`animate-float` hits). The matching `src/components/animations/glowPulse.ts` motion file (variants `glowPulse`, `accentGlowPulse`, `orb`, `borderGlow`) is also **entirely unused** — confirmed by `grep -rl "glowPulse\|accentGlowPulse\|borderGlow"` returning only its own declaration file.
- `borderRadius` (lines 67–71): `lg`/`md`/`sm` mapped to `var(--radius)` (`0.75rem` from `globals.css:26`) — standard shadcn plumbing, not directly grepped for usage but low-value to port since almost all radii in this codebase are literal (`rounded-3xl`, `rounded-[24px]`, `rounded-[14px]`, etc.).

**Verdict: the entire `rgba(108,99,255,…)` (indigo) / `rgba(0,153,170,…)` (teal) "glow" system — colors, shadows, gradients, keyframes, and the `glowPulse.ts` motion file — is 100% dead code.** It was likely a starter-template leftover never wired into the actual Figma-driven design. Do not port it as if it were load-bearing.

### 1.3 `globals.css` — CSS custom properties (`:root`, lines 6–27)

Shadcn/ui-style HSL triplets (no `hsl()` wrapper, consumed via `hsl(var(--x))` in `tailwind.config.ts`):

```
--background: 0 0% 89.8%       --card: 0 0% 100%              --popover: 0 0% 100%
--foreground: 240 15% 6%       --card-foreground: 240 15% 6%  --popover-foreground: 240 15% 6%
--primary: 249 88% 63%         --primary-foreground: 0 0% 100%
--secondary: 0 0% 93%          --secondary-foreground: 240 15% 6%
--muted: 0 0% 93%               --muted-foreground: 220 9% 46%
--accent: 187 100% 33%          --accent-foreground: 0 0% 100%
--destructive: 0 72% 51%        --destructive-foreground: 0 0% 100%
--border: 0 0% 82%              --input: 0 0% 82%               --ring: 249 88% 63%
--radius: 0.75rem
```

Only `--border` (`0 0% 82%`, a light grey) is actually rendered — via the global reset `* { @apply border-border; }` at `globals.css:32`, which sets every element's default border color. All the others (`--primary` = a violet `hsl(249 88% 63%)`, `--accent` = a teal `hsl(187 100% 33%)`, `--destructive`, `--card`, `--popover`, etc.) are **unused shadcn scaffolding**, never referenced by any component (confirmed by grep in §1.1).

### 1.4 `globals.css` — literal colors actually painting the page

These are the values that matter for a 1:1 port, taken directly from `globals.css`:

- Page background: `#E5E5E5` — `globals.css:36` (`html`), `:41` (`body`), `:59` (scrollbar track). This is the base canvas color the whole page sits on (matches `bg` token, which is otherwise unused as a class).
- Body text color: `#000000` — `globals.css:42`.
- Selection highlight: `rgba(0, 0, 0, 0.12)` bg, `#000000` text — `globals.css:50-52`.
- Scrollbar thumb: `rgba(108, 99, 255, 0.3)` idle / `rgba(108, 99, 255, 0.55)` hover — `globals.css:63,68`. **Note:** this is the one place the "dead" indigo glow color (`108,99,255`) is actually live on screen (the custom scrollbar thumb) — it is NOT applied via `.glow-primary`/`shadow-glow-primary`, just this raw rule.
- Card scrollbar override (`.card-scroll`, used by `AboutMission.tsx` when the mission card is expanded): thumb `#0000004d` (black 30%) — `globals.css:104-121`.
- `.surface-card` / `.surface-card-hover` / `.section-tint` / `.section-tint-alt` / `.noise-overlay` (`globals.css:123-160`): all **unused** utility classes (declared, never referenced by any `.tsx` file — grepped).
- `.text-gradient-primary` (`linear-gradient(135deg, #6C63FF 0%, #0099AA 100%)`) and `.text-gradient-warm` (`linear-gradient(135deg, #0F0F1A 0%, #6C63FF 60%, #0099AA 100%)`) — `globals.css:81-93` — **both unused**.
- `.cv-auto` (`content-visibility: auto`) — `globals.css:166-169` — **used**, applied to below-the-fold sections for render deferral: `Pricing.tsx:318`, `Footer.tsx:29`, `agentic/AgenticAwareness.tsx:166`, `about/AboutMission.tsx:76`, `CTA.tsx:23`, `agentic/AgenticOEMs.tsx:52`, `about/AboutHero.tsx:135`, `agentic/AgenticLoop.tsx:416`, `about/AboutPartners.tsx:29`.
- `.main-section-fade` (`globals.css:171-195`) — mask-image top-fade for `MainSection`, desktop-only (`@media (min-width: 768px)`). Used: `layout/MainSection.tsx:34`.
- `.hero-mobile-pill` (`globals.css:197-202`, mobile-only border override) — used: `Hero.tsx`, `agentic/AgenticHero.tsx`.
- `.hero-card-border-run` + `@keyframes heroCardBorderRun` (`globals.css:204-217`) — traveling dash on the hero video hover card; used in `ui/HeroVideoCard.tsx:150`.
- `.border-gradient-bottom` / `.border-gradient-top` + `@keyframes star-movement-*` (`globals.css:219-262`) — the "star border" traveling glow; used in `ui/StarBorder.tsx:23,28`.
- `.nav-dropdown-item:hover` (`globals.css:264-271`, gradient `rgba(197,209,208,0.2)` → `rgba(97,107,101,0.2)`) — used: `layout/Navbar.tsx:555`.
- `.marquee-track-left` / `.marquee-track-right` + `@keyframes marquee-left/right` (`globals.css:273-295`) — **declared, but not referenced by any `.tsx` file** (unused; the actual partner-logo marquees in `AboutPartners.tsx` use static grids, not this class, and `AgenticLayer`/`AboutMission` marquees use the separate `.agentic-watermark-marquee` class instead).
- `.agentic-watermark-marquee` + `@keyframes agenticWatermarkMarquee` (`globals.css:176-187`) — used: `agentic/AgenticLayer.tsx:201`, `about/AboutMission.tsx:174`.
- `prefers-reduced-motion` global kill-switch (`globals.css:297-305`).

### 1.5 Other hardcoded colors seen repeatedly across components (not in any token/CSS file — grepped by reading each section)

These are the actual "palette" a pixel-accurate port needs, since the token system in §1.1 is not what's rendered:

- Near-black gradient for dark pills/buttons (`PillButton.tsx:9-10`, reused in `Navbar.tsx:600,721,738`, `AboutHero.tsx:13-14`): `linear-gradient(131deg, rgb(51,51,51) 0.79%, rgb(13,13,13) 35.22%, rgb(38,38,38) 99.16%)` (Navbar mobile menu uses a slightly different angle: `136deg`).
- Metallic/iridescent conic border for glass pills (`ui/GlassPill.tsx:5-6`): `#D9D9D9`, `#F2F2F2`, `#DFD0EA`, `#A6CEDA`, `#ECECEC` conic stops.
- Glass pill fill (`ui/GlassPill.tsx:8-12`): `rgba(255,255,255,0.80)` → `rgba(255,255,255,0.40)` → `rgba(223,227,229,0.50)`.
- Mission-card fill: `#E6E6EB` (`about/AboutMission.tsx:284,288,324`).
- Mission section background: `linear-gradient(to bottom, #f5f5f5, #fafafa)` (`about/AboutMission.tsx:76`).
- Agentic loop panel overlays (`agentic/AgenticLoop.tsx:17-21`): edge `linear-gradient(102.41deg, rgba(0,0,0,0.32) …, rgba(45,45,45,0.28) …, rgba(0,0,0,0.22) …)`; cloud a mirrored variant.
- Loop-arrow gradient stops: `#7AA297` → `#8CAFA5`/`#FFFFFF` (`agentic/AgenticLoop.tsx:280-294,388-401`).
- `#8FA6B0` — small uppercase eyebrow/tag text color (`agentic/AgenticAwareness.tsx:189`, `agentic/AgenticOEMs.tsx:76`).
- MainSection's page-bottom gradient (`layout/MainSection.tsx:8`): `linear-gradient(0deg, rgba(242,242,242,0) 0%, rgb(224,224,224) 30.945%, rgb(215,215,215) 45.719%, rgb(255,255,255) 100%)`.
- Desktop nav dropdown panel background (`layout/Navbar.tsx:534-538`): `linear-gradient(90.64deg, #FFFFFF 4.23%, rgba(255,255,255,0.8) 56%, rgba(223,227,230,0.8) 99.91%)`, border `#D9D9D9`.
- Mobile nav sheet background (`layout/Navbar.tsx:599-600`): `linear-gradient(180deg, #1f1f1f 0%, #0a0a0a 100%)`.

**Recommendation for the port:** treat §1.5 (and the literal hexes cited inline in §1.1) as the real palette; the `tailwind.config.ts` named tokens are largely a paper trail from an earlier iteration and can be ported for parity but will need almost none of their classes actually used in new components unless the target intentionally starts using semantic names going forward.

---

## 2. Typography

### 2.1 Font loading — `src/app/layout.tsx:1-29`

Three font sources, all wired through CSS variables consumed by `tailwind.config.ts:30-36`:

1. **Golos Text** (`next/font/google`, `layout.tsx:8-14`):
   ```ts
   const golosText = Golos_Text({
     subsets: ["latin"],
     variable: "--font-golos-text",
     display: "swap",
     preload: true,
     weight: ["400", "500", "600", "700", "800", "900"],
   });
   ```
   Mapped to `fontFamily.display`, `fontFamily.body`, `fontFamily.sans` (all three point at the same variable — `tailwind.config.ts:31,32,34`). This is the body/heading workhorse font for the entire site.

2. **JetBrains Mono** (`next/font/google`, `layout.tsx:16-22`):
   ```ts
   const jetbrainsMono = JetBrains_Mono({
     subsets: ["latin"],
     variable: "--font-jetbrains-mono",
     display: "swap",
     preload: false,
     weight: ["400", "500", "600"],
   });
   ```
   Mapped to `fontFamily.mono` (`tailwind.config.ts:33`). **Unused anywhere in components** — grepped `font-mono` across `src`, 0 hits outside config. It is however referenced by name inline in `agentic/AgenticLoop.tsx:217,325` (`fontFamily: "var(--font-golos-text), sans-serif"` — that's Golos, not mono; the mono variable itself is never consumed by any inline style either).

3. **SuperGround** (`next/font/local`, `layout.tsx:24-29`):
   ```ts
   const superGround = localFont({
     src: "../../public/font/SuperGround-L3XZ4.ttf",
     variable: "--font-super-ground",
     display: "swap",
     preload: false,
   });
   ```
   Single `.ttf` file, no explicit `weight`/`style` (defaults to whatever the font file itself declares — could not determine the font's own internal weight/style metadata without opening the binary). Mapped to `fontFamily.superground` (`tailwind.config.ts:35`). This is a **display/wordmark-only** face — used exclusively for short, lowercase, brand-flavoured strings (`sr agentic`, `sr platform`, `one intelligence layer`, section eyebrow words), never for paragraph copy. Files using it (`font-superground` class, 7 files): `CTA.tsx:81`, `agentic/AgenticHero.tsx:75`, `agentic/AgenticAwareness.tsx:44`, `agentic/AgenticLayer.tsx:201`, `agentic/AgenticOEMs.tsx:83`, `agentic/AgenticLoop.tsx:62`, `about/AboutMission.tsx:174`.

All three variables are applied on `<html>` (`layout.tsx:60-63`), and `body` sets `font-family: var(--font-golos-text), sans-serif` directly in `globals.css:43` (belt-and-suspenders with the Tailwind `font-body` class also applied on `<body>` in `layout.tsx:64`).

**Asset:** `public/font/SuperGround-L3XZ4.ttf` — 21,084 bytes. This file **must be copied** into the target project (or an equivalent substitute font chosen) since it's a local binary, not a Google Font.

### 2.2 Type scale in actual use (grepped headline/body classes across sections)

Representative headline sizes (all `clamp()`-based, i.e. fluid between a mobile and desktop cap):

| Section / element | Class | File:line |
|---|---|---|
| Hero H1 | `text-[clamp(40px,4.6vw,72px)] font-normal leading-[1.05] tracking-[-0.02em]` | `Hero.tsx:107` |
| Features H2 (desktop) | `md:text-[clamp(36px,4vw,64px)] md:leading-[1.1] md:tracking-[-0.02em]` | `Features.tsx:483` |
| Features H2 (mobile) | `max-md:text-[32px] max-md:font-medium max-md:leading-normal max-md:tracking-[-0.04em]` | `Features.tsx:483` |
| About Hero H1 | `text-[clamp(56px,9vw,96px)] leading-[1.02] tracking-[-0.02em]` | `AboutHero.tsx:168` |
| About Mission H2 | `text-[32px] leading-[1.25] tracking-[-0.6px] md:text-[54px] md:leading-[70px] md:tracking-[-1.08px]` | `AboutMission.tsx:270` |
| About Partners H2 | `text-[clamp(34px,5vw,64px)] leading-[1.1] tracking-[-1.28px]` | `AboutPartners.tsx:41` |
| Agentic Hero wordmark (superground) | `text-[min(32px,8.2vw)] lg:text-[clamp(42px,8vw,78px)]` | `AgenticHero.tsx:75` |
| Agentic Hero H2 | `text-[clamp(36px,4.4vw,68px)] leading-[1.05] tracking-[-0.02em]` | `AgenticHero.tsx:113` |
| Agentic Loop H2 | `text-[clamp(32px,3.8vw,52px)] leading-[1.15] tracking-[-0.02em]` | `AgenticLoop.tsx:470` |
| Agentic Awareness H2 | `text-[32px] leading-9 tracking-[-0.64px] md:text-[64px] md:leading-[70px]` | `AgenticAwareness.tsx:196` |
| Agentic OEMs H2 | `text-[34px] leading-[1.08] tracking-[-0.02em] lg:text-[64px] lg:leading-[70px]` | `AgenticOEMs.tsx:80` |
| CTA wordmark (superground, lowercase) | `text-[32px] leading-none md:text-[64px]` | `CTA.tsx:81` |
| Body copy (generic) | `text-base leading-6` (16px/24px) | `Hero.tsx:115`, `AgenticHero.tsx:121`, `AgenticLoop.tsx:478`, `Features.tsx:489` |
| Small/eyebrow copy | `text-sm` (14px) or explicit `text-[14px]` | throughout (badges, tags) |

**Pattern:** every major headline pairs a large fluid `clamp()`/responsive size with a **tight negative tracking** (roughly −0.02em on big display type, scaling to larger fixed negative px values like `-0.64px`/`-1.08px`/`-1.28px` at bigger sizes) and a **tight leading** (`1.02`–`1.25` for display, `1.1` for sub-headlines). Body copy stays at default/loose tracking with `leading-6`/`leading-[22px]`.

### 2.3 Letter-spacing conventions

- Display headlines: `tracking-[-0.02em]` is the dominant convention (Hero, Features desktop, About Hero, Agentic Hero H2/Loop/OEMs).
- Larger literal px negative tracking on bigger point sizes: `-0.6px`/`-1.08px` (About Mission), `-1.28px` (About Partners), `-0.64px` (Agentic Awareness).
- Small UI text (badges, pills, nav links): `tracking-normal` explicitly set (e.g. `Navbar.tsx:499`) or left default.
- Wordmark/eyebrow text in SuperGround: sometimes given **positive** tracking instead, e.g. `tracking-[0.08em]` on the loop panel label (`AgenticLoop.tsx:62`) and `letterSpacing={0.18em}`/`0.22em` on `CircularText` (`CircularText.tsx:22`, `CTA.tsx:52`) — the display font is spaced out when used in all-lowercase small-caps-like contexts, tightened when used at large wordmark size.

### 2.4 Text treatments

- **Gradient text** (`bg-gradient-to-r from-black to-[#314344] bg-clip-text text-transparent`): `about/AboutHero.tsx:168`, `agentic/AgenticHero.tsx:75`. Note this is distinct from the plain solid-color accent span (`text-[#314344]`) used for the same visual role in `Hero.tsx:111` and `AgenticHero.tsx:116` — **the codebase is inconsistent about whether the "accent" word in a headline is a two-stop gradient or a flat color**; both patterns exist side by side.
- **Unused gradient-text utilities**: `.text-gradient-primary` / `.text-gradient-warm` in `globals.css:81-93` (indigo/teal gradients) — dead, not the same gradient as the ones actually used.
- **Uppercase eyebrow labels**: `AGENTIC_AWARENESS.tag` rendered with `uppercase` class (`agentic/AgenticAwareness.tsx:189`), `AGENTIC_OEMS.tag` likewise (`agentic/AgenticOEMs.tsx:76`). Color `#8FA6B0`, `text-[14px]`/`text-base`, `tracking-normal`.
- **Lowercase wordmarks in SuperGround**: `CTA.tsx:81` (`lowercase` class on the h2 even though `wordmark` values in `constants.ts` are already lowercase strings), `about/AboutMission.tsx:174` watermark text (`lowercase` class), `agentic/AgenticLoop.tsx:62` panel label (content itself lowercase, no explicit class). This is a consistent brand convention: **SuperGround is only ever used lowercase**, for short "wordmark"-style words.
- **Bold inline runs**: `about/AboutMission.tsx:308-314` renders per-paragraph "runs" from `ABOUT_MISSION.paragraphs` with a `bold?: boolean` flag → `<span className="font-bold">`; `Features.tsx:56-68` similarly bolds a matched `boldPhrase` substring inside a feature description.
- **Notch/watermark marquee text**: giant (`text-[clamp(40px,8vw,72px)]`/`text-[48px] md:text-[72px]`), very low-opacity black (`text-black/[0.06]` / `text-black/5`), SuperGround, lowercase, animated horizontally (`.agentic-watermark-marquee`) — a recurring "giant faint background word" motif in `about/AboutMission.tsx` and `agentic/AgenticLayer.tsx`.

---

## 3. Component inventory — `src/components/ui/` and `src/components/layout/`

### `src/components/ui/PillButton.tsx` (184 lines)
Exports: `PillButton`, `PillButtonCta`.
- `PillButton({ variant?: "dark" | "outline" = "dark", size?: "sm" | "md" | "lg" = "md", showArrow?: boolean = true, icon?: ReactNode, className?: string, children: ReactNode, onClick?: () => void })`
- `PillButtonCta({ className?: string, children: ReactNode, showShadow?: boolean = false })`
Renders a `motion.button` pill: `variant="dark"` uses the near-black `darkGradient` fill + a `StarBorderLayer` traveling-glow rim (masked to a 1.5px border via `StarRimCover`) + trailing `ArrowRight` icon; `variant="outline"` is a white pill with a subtle gradient border and no star effect. `PillButtonCta` is the dark-gradient pill hardcoded for CTA usage (always shows the arrow, optional drop shadow via `showShadow`). Depends on: `darkGradient` literal (§1.5), `StarBorderLayer` (`ui/StarBorder.tsx`), `cn()` (`lib/utils.ts`), `lucide-react`'s `ArrowRight`.

### `src/components/ui/GlassPill.tsx` (60 lines)
Exports: `GlassPill` (component), plus the constants `METALLIC_BORDER_BG`, `PILL_BAR_BG`, `PILL_BAR_SHADOW`, `GPU_LAYER` (re-used directly by `Navbar.tsx`).
- `GlassPill({ children: ReactNode, className?: string, innerClassName?: string, radius?: number = 12 })`
Two-layer glass pill: outer `div` painted with the conic `METALLIC_BORDER_BG` gradient at `radius`, 1.4px padding, containing an inner `div` at `radius - 1.4` with `PILL_BAR_BG` translucent white gradient fill, `blur(10px)` backdrop-filter, and `PILL_BAR_SHADOW` inset highlights. Purely presentational/frame component — no internal state.

### `src/components/ui/StarBorder.tsx` (33 lines)
Exports: `StarBorderLayer({ color?: string = "white", speed?: string = "5s" })`.
Renders two absolutely-positioned `<span>` layers (`.border-gradient-bottom`, `.border-gradient-top` from `globals.css`) each painted with a `radial-gradient(circle, ${color}, transparent 10%)` and an `animationDuration` of `speed`. Meant to be dropped inside any `relative overflow-hidden` pill; depends entirely on the `@keyframes star-movement-bottom/top` in `globals.css:243-262`.

### `src/components/ui/AutoplayVideo.tsx` (234 lines)
Exports: `AutoplayVideo`.
- `AutoplayVideo({ src: string, className?: string, objectPosition?: string = "center", ariaLabel?: string, eager?: boolean = false, loadOnScroll?: boolean = false, playMode?: "auto" | "press" = "auto", isPressing?: boolean = false, mobileTapFullscreen?: boolean = false })`
A `<video muted loop playsInline>` wrapper with heavy lazy-load logic: `IntersectionObserver`-gated loading (`rootMargin: 200px`) unless `eager`/`loadOnScroll` is set; pauses when scrolled out of view; `playMode="press"` variant only plays while a parent reports `isPressing` (used for press-and-hold previews); `mobileTapFullscreen` swaps to a tap-to-play UI with its own play-button overlay on narrow viewports (`max-width: 767px`). No color/token dependency beyond a `bg-black/5`/`bg-white/25` play button and `currentColor` SVG icon — purely behavioral, easy to port.

### `src/components/ui/HeroVideoCard.tsx` (156 lines)
Exports: `HeroVideoCard` (no props — reads `/images/hero-watch-preview.png` internally).
Renders the small "Watch full video" glass hover-card that appears over the bottom-right corner of the hero video on desktop hover. Uses a hand-authored SVG path (`CARD_SILHOUETTE`) both as a CSS `mask-image` (data-URI SVG) to crop a `backdrop-filter: blur(20px)` glass panel to a speech-bubble/notch silhouette, and as a stroked `<path>` with `pathLength={100}` + `strokeDasharray` driven by the `.hero-card-border-run` CSS animation for the traveling-dash border. Depends on: `globals.css` `.hero-card-border-run` keyframe, `public/images/hero-watch-preview.png` (127,105 bytes), `framer-motion` for the mount/unmount transition.

### `src/components/ui/ScrollVideoReveal.tsx` (72 lines)
Exports: `ScrollVideoReveal`.
- `ScrollVideoReveal({ children: ReactNode, className?: string, targetRef?: RefObject<HTMLDivElement | null> })`
Wraps children in a `perspective` container and applies scroll-linked `rotateX`/`scale` transforms (via `framer-motion`'s `useScroll`/`useTransform`, driven by `REVEAL_OFFSET` from `animations/scrollVideoReveal.ts`) so the hero video visually "tilts up" into place as the user scrolls to it. Falls back to a plain static `div` under `prefers-reduced-motion`. No color dependency — pure motion component.

### `src/components/ui/BgFillOverlay.tsx` (102 lines)
Exports: `BgFillOverlay` (no props).
Renders a `fixed inset-0 z-[15] bg-white` layer whose `clip-path: circle()` radius is scroll-driven (tracks the `#how-it-works` element's position) to simulate a rising white "water level" that swallows the hero background before `HowItWorks` appears. **Confirmed unused** — `grep -rn "BgFillOverlay" src` finds only its own declaration; it is not imported by `page.tsx`, `about/page.tsx`, or `agentic/page.tsx`. Dead code, but documents an intended (and abandoned or not-yet-wired) z-index contract that's spelled out in its own comment (`BgFillOverlay.tsx:16-27`): navbar z-50 (out of date — actual Navbar is now z-[1000]) > `main`/sections z-20 > this overlay z-15 > Hero/Features content z-10 > sticky bg z-(-10).

### `src/components/ui/CircularText.tsx` (79 lines)
Exports: `CircularText`.
- `CircularText({ text: string, diameter?: number = 240, fontSize?: number = 18, letterSpacing?: number = 0.18, durationSeconds?: number = 22, reverse?: boolean = false, className?: string, textClassName?: string })`
Lays `text` on a circular SVG `<textPath>` and spins the whole `<motion.div>` continuously (`rotate: ±360`, linear, infinite) unless `prefers-reduced-motion`. Text uses `fill-current` (inherits color from `className`/`textClassName`) and forces `textTransform: uppercase`. Used once, for the rotating "STRIKE ROBOT •" badge in `CTA.tsx:48-55`.

### `src/components/ui/AnimatedButtonLabel.tsx` (138 lines)
Exports: `AnimatedButtonLabel`. **Confirmed unused** anywhere else in `src` (grep found no importer).
- `AnimatedButtonLabel({ children: string, className?: string, active?: boolean = false, weightRange?: [number, number] = [500, 700] })`
Per-letter "jitter" hover animation (randomized y/scale/rotate/opacity/weight per character via a seeded pseudo-random function) gated to `active` + fine-pointer devices. Self-contained, no color/token dependency. Flag as available-but-dead: a port can skip it unless the new project wants this micro-interaction.

### `src/components/ui/AnimatedSection.tsx` (36 lines)
Exports: `AnimatedSection`. **Confirmed unused** anywhere else in `src`.
- `AnimatedSection({ children: ReactNode, className?: string, id?: string, delay?: number = 0 })`
Generic `motion.section` fade-up-on-scroll wrapper (`opacity 0→1`, `y: 32→0`, `viewport once`). Every real section in the codebase instead hand-rolls its own `motion.div`/`motion.section` with the shared `fadeUp`/`staggerContainer` variants (see §4), so this generic wrapper was superseded and left orphaned.

### `src/components/ui/MenuIcon.tsx` (31 lines)
Exports: `MenuIcon({ className?: string })`. A static 3-bar hamburger SVG (`currentColor` strokes). Used only by `layout/Navbar.tsx`'s `MobileMenuButton`.

### `src/components/ui/SmoothScroll.tsx` (36 lines)
Exports: `SmoothScroll({ children: ReactNode })`. Wraps `children` and initializes a `lenis` smooth-scroll instance (`duration: 0.9`, custom cubic ease-out, `touchMultiplier: 0` i.e. disabled on touch) gated behind `(prefers-reduced-motion: reduce)` and `(hover: hover) and (pointer: fine)` media checks — desktop-with-mouse only. Mounted once, at the root, in `app/layout.tsx:65`. Depends on the `lenis` npm package.

### `src/components/layout/MainSection.tsx` (42 lines)
Exports: `MainSection({ children: ReactNode, transparent?: boolean = false })`.
Two modes: `transparent` renders a bare `<main className="relative z-20 overflow-hidden">` (used on `/about` and `/agentic`, where a page-level sticky hero background must show through the whole lower page); non-transparent (default, used on `/`) additionally paints the Figma-derived `GRADIENT` background (§1.5) and applies `.main-section-fade` (top mask-fade, desktop only) so the lower half of the page blends into the hero image above it.

### `src/components/layout/Navbar.tsx` (758 lines)
Exports: `Navbar()` (no props — reads `NAV_LINKS`, `NAV_CTA`, `SITE_NAME` from `lib/constants.ts`).
Fixed (`z-[1000]`), non-scrolling header. Desktop (`md:flex`): logo + a `GlassPill`-framed nav bar with a "Product" dropdown (`PRODUCT_LINKS`: SR Platform / SR Agentic, each with an inline hand-authored SVG icon) + a `PillButtonCta`. Mobile: a separate `MobileScrollHeader` that morphs from borderless to a `GlassPill`-style bar as the user scrolls the first 120px (spring-driven padding/border-radius/blur via `framer-motion`'s `useSpring`/`useTransform`/`useMotionTemplate`), plus a full-screen `AnimatePresence`-mounted mobile menu sheet (dark gradient background, looping logo watermark, expandable "Product" sub-list, bottom dark CTA pill with its own `StarBorderLayer`). Depends on: `GlassPill`, `PillButtonCta`, `StarBorderLayer`, `MenuIcon`, `cn()`, `lucide-react` (`ChevronDown`, `X`, `ArrowRight`), `next/image`, `next/link`.

### `src/components/layout/StickyHeroBackground.tsx` (25 lines)
Exports: `StickyHeroBackground()` (no props — reads `HERO_BACKGROUND`/`HERO_BACKGROUND_MOBILE` from `lib/constants.ts`).
A `pointer-events-none sticky top-0 -z-10 h-[100dvh]` wrapper around a `<picture>` that swaps `Background.png` (desktop, ≥768px, 2.17MB) for `Top Bg_Sticky.png` (mobile, 530KB) via a media-query `<source>`. This is the full-bleed image that appears to "stay behind" the hero content while the content scrolls over it (the `-mt-[100dvh]` trick in the pages — see §5).

---

## 4. Section structure — `src/components/sections/` (including `about/` and `agentic/`)

### `Hero.tsx` (213 lines) — homepage hero
Skeleton: `<section className="relative z-10 flex flex-col items-center px-3 md:px-[48px]">` containing (a) a title block (`motion.div`, `min-h-[calc(100dvh-72px/128px)]`) with two badge pills (colored per `HERO.badge1/2`), an H1 with a plain-color accent span, a description `<p>`, and two `PillButton`s (dark + outline) — the whole block fades/scales out as the user scrolls via `useScroll`+`useTransform` tied to the video wrapper below; then (b) a `ScrollVideoReveal`-wrapped video card (`aspect-[1200/484]`, rounded-3xl, `AutoplayVideo` + a desktop-only `HeroVideoCard` hover overlay driven by `useVideoHoverCard`); then (c) a mobile-only "Watch full video" row below the video. Composes: `PillButton`, `AutoplayVideo`, `HeroVideoCard`, `ScrollVideoReveal`, hooks `useVideoHoverCard`, animation helpers `fadeUp`/`staggerContainer`/`REVEAL_OFFSET`.

### `Features.tsx` (546 lines) — accordion feature list + video
Skeleton: `<section id="features">` → a `wrapperRef` div with absolute top/bottom rule lines and left/right decorative bracket SVGs framing a `max-w-[1268px]` inner content column; inside: (a) a header band (H2 + description), (b) a two-column row on `lg+` — left: a vertical list of `FeatureItem` accordion rows (icon, title, expandable description + mobile-only inline video) with a spring-animated left-edge indicator bar tracking the active item's icon position (measured via `getBoundingClientRect` + `ResizeObserver`), plus a `PillButtonCta`; right (`lg:block`, hidden on mobile): a large `800×480` `AutoplayVideo` panel that re-keys per active feature. Composes: `PillButtonCta`, `AutoplayVideo`, `fadeUp`/`staggerContainer`.

### `HowItWorks.tsx` (225 lines) — animated SVG title band
Skeleton: `<section id="how-it-works" className="... max-md:hidden">` (**desktop-only — entirely hidden on mobile**) containing two `<svg viewBox="0 0 1440 230">` (`hidden md:block` desktop / `block md:hidden` mobile, though the mobile one never renders because the whole section is `max-md:hidden`) with text riding a curved `<path>` via `<textPath>`, drifting continuously leftward (RAF-driven `startOffset`, paused via `IntersectionObserver` when off-screen). No UI-component composition — self-contained SVG/text animation, driven by `SCROLLING_TEXT` from constants.

### `Pricing.tsx` (349 lines) — "Community" cards (despite the filename)
Skeleton: `<section id="community">` → a 2-column (`md:grid-cols-2`) grid of `CommunityCard`s (Explore / Blog). Each card: a notch-masked (custom SVG data-URI mask) media area with `AutoplayVideo` + a dark bottom gradient that fades on hover, a tag pill, a vertical dotted connector, a title, a hover-revealed description tooltip, and a circular arrow button that morphs to a black "Explore ▸" label on hover/long-press (mobile has bespoke pointer-hold/tap-to-reveal logic). Composes: `AutoplayVideo`, `fadeUp`/`staggerContainer`. **Note the section id/component name mismatch** (`Pricing.tsx` exports `Pricing()` but renders community-showcase cards, not pricing tiers — no pricing content exists anywhere in this codebase).

### `CTA.tsx` (116 lines) — reusable closing CTA banner
Skeleton: `<section id="cta">` → a full-bleed rounded-3xl black card with a background `<Image>` (`VIDEO_CTA.background`, a static PNG despite the name), a `CircularText` rotating badge in the corner, and a centered content column (subtitle, SuperGround lowercase wordmark, `PillButtonCta`, and a footer-link nav positioned bottom-left on desktop). Parameterized by `variant: "platform" | "agentic" | "about"` which swaps copy via `CTA_VARIANTS`. Composes: `PillButtonCta`, `CircularText`, `fadeUp`/`staggerContainer`. Used identically at the bottom of all three pages.

### `Footer.tsx` (73 lines)
Skeleton: `<footer>` → a responsive row (`flex-col` mobile / `flex-row` desktop, using CSS `contents` to reorder logo/socials/copyright between the two breakpoints) with logo, 3 social icon buttons (X/GitHub/GitBook, inline SVGs), and a copyright string. No video/motion; static.

### `about/AboutHero.tsx` (246 lines)
Skeleton: `<section>` (page-level `cv-auto`) layering, back-to-front: `HeroSpotlightHands` (cursor-tracked spotlight reveal over big hand images), a (currently commented-out) `HeroAICore` iframe slot, then a content layer with a sequential (A→B→C→D delay-staggered) reveal: gradient-text H1 + desktop follow-button, a description paragraph with a decorative bracket SVG, mobile follow-button + mobile hand image, and a row of social icon links. Composes: `HeroSpotlightHands`, `StarBorderLayer` (for the follow button).

### `about/AboutMission.tsx` (357 lines)
Skeleton: `<section id="mission">` with a `from-[#f5f5f5] to-[#fafafa]` gradient background, absolutely-positioned reaching-hand images (mobile: small static pair; desktop: two `useReverseMagnet`-driven large hand images peeking from bottom corners), a background `.agentic-watermark-marquee` of the word "sr agentic", and a foreground two-column band (headline + an expandable "read more" quote card clipped to a custom notch `clip-path`, scrollable via `.card-scroll` when expanded). Composes: `useReverseMagnet` hook.

### `about/AboutPartners.tsx` (110 lines)
Skeleton: `<section id="partners">` → headline + description, then a static logo grid: 2-col on mobile, wrapped 4/2 flex-wrap on desktop, each logo card with a subtle 3D hover tilt (`hover:[transform:rotateX(4deg)_rotateY(-6deg)_scale(1.02)]`). No carousel/marquee despite the constants comment mentioning one — it's a static grid. Composes: `fadeUp`/`staggerContainer`/`staggerItem`.

### `about/HeroAICore.tsx` (60 lines)
Skeleton: a single `<iframe src="/ai-core/index.html">` embedding a standalone three.js scene shipped as a static HTML file (`public/ai-core/index.html`, 6.9KB) with a runtime hack to force the iframe's own background transparent. **Currently commented out** in `AboutHero.tsx:151-159,11` ("temporarily hidden — re-enable when ready").

### `about/HeroSpotlightHands.tsx` (185 lines)
Skeleton: `forwardRef` component stacking 2–3 `next/image` layers (base hands + up to 2 "effect" overlays) where the top layers are revealed only inside a CSS `radial-gradient` mask that follows `--mx`/`--my` custom properties set by the parent's pointer-move handler; optional `magnet` mode also repels the whole group from the cursor via `useReverseMagnet`. Props: `{ baseImage, effectImage?, effectImage2?, radius?=250, feather?=0.25, glow?=false, magnet?=false }`.

### `agentic/AgenticHero.tsx` (173 lines)
Same overall shape as `Hero.tsx` (title block that fades on scroll + `ScrollVideoReveal`-wrapped video + hover card), but restructured as a 2-column CSS grid on `lg+` (SuperGround wordmark + CTA row on the left, headline/description/badge on the right) that collapses to a single reordered (`order-*`) column on mobile. Composes: `PillButton`, `AutoplayVideo`, `HeroVideoCard`, `ScrollVideoReveal`, `useVideoHoverCard`.

### `agentic/AgenticLayer.tsx` (216 lines)
Skeleton: near-identical header-band framing to `Features.tsx` (top/bottom rule lines, side brackets, `max-w-[1268px]` column, `LINE_LEFT`-positioned vertical rule) but the body is a 4-card grid of `AGENTIC_PARTS` (media thumbnail — `.gif` or `.png` — + title + description) that becomes an `embla-carousel-react` drag carousel below the `sm` breakpoint (disabled at `≥640px` via Embla's own `breakpoints` option, reverting to a plain CSS grid). Ends with a `.agentic-watermark-marquee` band repeating "one intelligence layer". Composes: `embla-carousel-react`, `fadeUp`/`fadeUpScale`/`staggerContainer`/`staggerContainerSlow`.

### `agentic/AgenticLoop.tsx` (526 lines)
Skeleton: headline + description, then a horizontally-scrollable-on-mobile (`.scrollbar-none overflow-x-auto`) 2-column grid of two `LoopPanel`s ("EDGE"/"CLOUD"), each an `aspect-[452/454]` card with a looping GIF background (`PANEL_BG_GIF`), a tinted overlay gradient, a `PanelHeader`, and 3 absolutely-positioned `NodeChip`s per panel at hand-tuned `%`-based coordinates. Two hand-authored curved `<motion.svg>` "comet" arrows (`CrossArrows`) cross between the panels with a looping drift+opacity pulse. Entirely bespoke — no shared `ui/` component beyond animation variants.

### `agentic/AgenticAwareness.tsx` (336 lines)
Skeleton: eyebrow tag + headline + description, then a slide carousel (custom index-state + `AnimatePresence` slide/exit variants driven by a computed `direction`) rendered twice — a small draggable (`drag="x"`) mobile card version and a larger desktop version with prev/next buttons and two different pagination-bar components (`MobilePagination` pill dots vs. `DesktopPagination` wider bars). No `embla`/library here — hand-rolled with `framer-motion`'s `drag`.

### `agentic/AgenticOEMs.tsx` (120 lines)
Skeleton: a 2-column (`lg:grid-cols-[1fr_544px]`) layout — headline/description column (order-1 mobile, order-2 desktop) and a stacked list of 4 `OEMBullet` rows (icon + title + description, divided by `border-b border-black/15`) on the other side (order-2 mobile, order-1 desktop). Simple, no video/carousel.

**Common motif across nearly every section:** a `motion.div`-drawn hairline top/bottom rule (`bg-black/15`, `scaleX`/`scaleY` reveal on `whileInView`) plus a pair of hand-authored bracket SVGs (`LEFT_BRACKET_D`/`RIGHT_BRACKET_D`, the exact same path string reused verbatim in `Features.tsx`, `AboutMission.tsx`, `AgenticLayer.tsx`, `AgenticLoop.tsx`) framing a `max-w-[1268px]` (or `1330px`/`1416px`, slightly inconsistent) centered content column. This bracket+rule "content frame" is effectively an unextracted shared component — worth factoring into one real component during the port rather than copy-pasting the SVG path 4+ times again.

---

## 5. Page skeleton

### `src/app/layout.tsx` (69 lines)
Root layout: loads the 3 fonts (§2.1), sets `<html lang="en">` with all 3 font CSS variables, wraps `children` in `<SmoothScroll>`, and sets `<body className="bg-transparent text-text font-body antialiased min-h-[100dvh]">`.

### `src/app/page.tsx` (30 lines) — home
```tsx
<Navbar />
<div className="relative">
  <StickyHeroBackground />
  <div className="relative z-10 -mt-[100dvh]">
    <Hero />
    <Features />
  </div>
</div>
<MainSection>
  <HowItWorks />
  <Pricing />
  <CTA />
  <Footer />
</MainSection>
```

### `src/app/about/page.tsx` (39 lines)
```tsx
<Navbar />
<div className="relative">
  <StickyHeroBackground />
  <div className="relative z-10 -mt-[100dvh]">
    <AboutHero />
    <MainSection transparent>
      <AboutMission />
      <AboutPartners />
      <CTA variant="about" />
      <Footer />
    </MainSection>
  </div>
</div>
```

### `src/app/agentic/page.tsx` (42 lines)
```tsx
<div className="relative">
  <StickyHeroBackground />
  <div className="relative z-10 -mt-[100dvh]">
    <Navbar />                {/* NOTE: Navbar is inside this wrapper here, unlike home/about */}
    <AgenticHero />
    <MainSection transparent>
      <AgenticLayer />
      <AgenticLoop />
      <div className="relative bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F7F7_48%,#FFFFFF_100%)]">
        <AgenticAwareness />
        <AgenticOEMs />
        <CTA variant="agentic" />
        <Footer />
      </div>
    </MainSection>
  </div>
</div>
```

### The two-tier sticky-backdrop structure

1. **Outer layer** — `StickyHeroBackground` (`layout/StickyHeroBackground.tsx`): `position: sticky; top: 0; z-index: -10; height: 100dvh`, holding the full-bleed `Background.png`/`Top Bg_Sticky.png`. Because it's `sticky` inside a `position: relative` parent that is exactly `100dvh` taller than the viewport (the effect of the `-mt-[100dvh]` sibling below), this image stays pinned to the top of the viewport for the first full screen of scroll, then scrolls away naturally once its `relative` parent's remaining height is exhausted.
2. **Inner layer** — a sibling `div` with `relative z-10 -mt-[100dvh]`: this negative margin pulls the hero/content section (`Hero`+`Features`, or `AboutHero`, or `Navbar`+`AgenticHero`) up so it visually overlaps and sits on top of the sticky background for the first viewport height, creating the "content floats over a pinned background image, then the background reveals itself only during that first scroll" effect. Both `div`s are children of one outer `<div className="relative">` — this is the load-bearing wrapper that makes the `sticky`/negative-margin trick work; it must be preserved as-is (not flattened) in the port.
3. **`MainSection`** (`z-20`) then sits below/after that wrapper (a **sibling**, not a child, of the `relative` wrapper on the home and about pages) and is `overflow-hidden`, guaranteeing it visually covers the sticky background once scrolled into view. On the `/agentic` page, `MainSection` is nested *inside* the same `-mt-[100dvh]` wrapper instead of being a sibling of it — a structural inconsistency worth normalizing during the port rather than copying blindly.

### Z-index stack (collected across files, lowest to highest)

| z-index | Element | Source |
|---|---|---|
| `-z-10` | `StickyHeroBackground` | `layout/StickyHeroBackground.tsx:11` |
| (none / `z-0`) | Hero/Features content (comment in `BgFillOverlay.tsx` says `z-10`, but `Hero.tsx`/`Features.tsx` don't actually set an explicit z-index beyond the wrapping `-mt-[100dvh]` div's `z-10`) | `page.tsx:17` (`className="relative z-10 -mt-[100dvh]"`) |
| `z-[15]` | `BgFillOverlay` (**dead/unused component**, see §3) | `ui/BgFillOverlay.tsx:98` |
| `z-20` | `MainSection` (`<main>`) | `layout/MainSection.tsx:29,34` |
| `z-[1000]` | `Navbar` `<header>` | `layout/Navbar.tsx:445` |
| `z-[1001]` | Mobile menu sheet (`AnimatePresence` panel) | `layout/Navbar.tsx:597` |

**Could not determine:** whether the `z-[15]` `BgFillOverlay` gap in the stack is intentional headroom for a not-yet-reinstated feature, or simply leftover — the component exists, is fully implemented, and is commented with a precise z-stack contract, but is wired into zero pages.

---

## 6. Assets — `public/`

Full listing with byte sizes (`find public -type f`, sizes via `stat -f%z`), grouped by consumer. (`.DS_Store` files excluded from the "referenced" analysis — they're macOS artifacts, not assets.)

### Fonts
- `font/SuperGround-L3XZ4.ttf` — 21,084 B — `app/layout.tsx:25` (`localFont` src). **Target has no equivalent; must be copied or substituted.**

### Images — global/shared
- `Logo.svg` — 4,336 B — `layout/Navbar.tsx:458,627`, `sections/Footer.tsx:40`.
- `Logo.png` — 4,775 B — `layout/Navbar.tsx:274` (`legacy` mobile logo variant).
- `images/Logo.png` — 11,160 B — **could not determine a referencing component** (grep of `images/Logo` found no hit in `src`; likely orphaned duplicate of `Logo.png`).
- `Background.png` — 2,173,658 B — `StickyHeroBackground` desktop source, via `HERO_BACKGROUND` (`lib/constants.ts:21`).
- `Top Bg_Sticky.png` — 530,579 B — `StickyHeroBackground` mobile source, via `HERO_BACKGROUND_MOBILE` (`lib/constants.ts:22`, URL-encoded as `/Top%20Bg_Sticky.png`).
- `create-with-sr-icon.svg` — 216,938 B — `sections/Hero.tsx:26` (`PlatformIcon`).
- `images/hero-watch-preview.png` — 127,105 B — `ui/HeroVideoCard.tsx:98`, `sections/Hero.tsx:186` (mobile row thumbnail).
- `images/feature-screenshot.png` — 673,591 B — **could not determine a referencing component** (no grep hit for this filename in `src`; likely unused/orphaned).
- `Vid.png` — 321,991 B — `CTA` background image, via `VIDEO_CTA.background` (`lib/constants.ts:102`) — despite the name, this is a **static PNG**, not a video.
- `Logo_button.png` — 876 B — **could not determine a referencing component** (no grep hit).
- `end_one_layer.png` — 7,082 B — **could not determine a referencing component** (no grep hit).

### Feature icons (`public/icons/features/`)
- `asset-creation.svg` (3,000 B), `spatial-layout.svg` (3,472 B), `stimulation.svg` (5,749 B), `realtime-edit.svg` (7,678 B) — all 4 referenced by `Features.tsx`'s `ICON_SRC` map (`Features.tsx:29-34`).
- `asset-creation.png` (3,321 B), `spatial-layout.png` (3,155 B), `stimulation.png` (2,477 B), `realtime-edit.png` (1,978 B), `export-pipeline.png` (3,315 B) — **PNG siblings not referenced anywhere** (`ICON_SRC` only points at the `.svg` files); `export-pipeline.png` in particular has no matching feature at all in `FEATURES` (`lib/constants.ts:42-78`). All 5 PNGs appear to be superseded leftovers.

### `/about` assets (`public/about/`)
- `hero-hands.png` (337,014 B) — `ABOUT_HERO.image`, `lib/constants.ts:308`, consumed by `AboutHero.tsx:214` (mobile hands).
- `layer-1.png` (1,099,369 B), `layer-2.png` (1,623,498 B), `layer-3-glow.png` (1,275,363 B) — passed as `baseImage`/`effectImage`/`effectImage2` to `HeroSpotlightHands` from `AboutHero.tsx:144-146`.
- `layer-3.png` (3,062,865 B) and `Layer 3.png` (1,383,712 B, note the space + capital in the filename) — **neither referenced** (only `layer-3-glow.png` is used, not plain `layer-3.png`); looks like leftover Figma export duplicates.
- `hand-left.png` (663,523 B) / `hero-right.png` (163,295 B) — `ABOUT_MISSION.handLeft`/`handRight` (`lib/constants.ts:356-357`), used in `AboutMission.tsx:133,158` (desktop reaching hands).
- `Left.png` (36,539 B) / `Right.png` (26,251 B) — mobile compact reaching-hands pair, `AboutMission.tsx:96,104`.
- `Logo Partners/{Base,Eastworlds,Orboh,Reppo,Venice,Virtuals Protocol}.png` — all 6 referenced by `ABOUT_PARTNERS.logos` (`lib/constants.ts:370-376`) and `AboutPartners.tsx`'s `LOGO_DIMENSIONS` map.
- `Logo.png` (19,688 B) — **could not determine a referencing component** (no grep hit inside `about/`-scoped code; distinct from the root `Logo.png`/`Logo.svg` actually used by Navbar/Footer).
- `partner-base.png` (16,961 B), `partner-reppo.png` (18,566 B), `partner-virtuals.png` (173,121 B) — **not referenced** (superseded by the `Logo Partners/` folder versions).
- `hero-effect.jpg` (19,480 B) — **could not determine a referencing component** (no grep hit).

### `/agentic` assets (`public/agentic/`)
- `awareness/{security-patrol,factory-inspection,search-rescue}.png` — desktop slide images, `AGENTIC_AWARENESS.slides[].imageSrc` (`lib/constants.ts:242-260`).
- `awareness/{anh-1,anh-2,anh-3}.png` — mobile slide images, `...mobileImageSrc` (same block; Vietnamese filenames — `anh` = "image" — a residual authoring artifact worth renaming during the port).
- `oems/{perception,domains,edge-cloud,security}.png` — `AGENTIC_OEMS.bullets[].icon` (`lib/constants.ts:276-296`).
- `parts/{tcsg,open-vocab,realtime,trust}.png` — **not referenced**: `AGENTIC_PARTS` in `lib/constants.ts:171-200` actually points its `media` field at `/SR%20Agentic%20Assets/S{1..4}.gif`, not these PNGs. These 4 PNGs are unused leftovers/an earlier version of the same imagery.

### `SR Agentic Assets/` (top-level, note: NOT inside `public/agentic/`)
- `S1.gif` (1,006,781 B), `S2.gif` (910,845 B), `S3.gif` (1,012,215 B), `S4.gif` (910,225 B) — `AGENTIC_PARTS[].media`, rendered in `AgenticLayer.tsx:158-164` as plain `<img>` (not `next/image`, since Next's image optimizer doesn't animate GIFs).
- `Effect Card Final.gif` (493,942 B) — `PANEL_BG_GIF` in `AgenticLoop.tsx:14`, the looping background of both EDGE/CLOUD panels.

### Video (`public/Video/`) — **the category the target project currently has none of**
- `hero-simulation.mp4` — **24,192,579 B (~24MB)** — `VIDEOS.hero` (`lib/constants.ts:15`), used as the main hero video on **both** `/` (`Hero.tsx:154`) and `/agentic` (`AgenticHero.tsx:151`) — i.e. the same 24MB file is reused for two different products' hero video, which reads as a placeholder rather than per-product footage.
- `Blog-Articles.mp4` (1,252,729 B) — `VIDEOS.communityBlog`, `Pricing.tsx` (Community/Blog card).
- `Community Creation.mp4` (2,089,060 B) — `VIDEOS.communityExplore`, `Pricing.tsx` (Community/Explore card). Note: `lib/constants.ts:17` references it as `Comp%201.mp4` for `featureEditor`, which **does not match any file on disk** (the actual file is `Comp 1.mp4`, present but unused — see next line) — `featureEditor` itself is never consumed by any component (grep found no `VIDEOS.featureEditor` usage).
- `Comp 1.mp4` (1,717,776 B), `Comp 2.mp4` (7,536,453 B), `Comp 3.mp4` (1,113,590 B) — **not referenced by any constant or component** (grepped `VIDEOS\.` usages against these names — no match); orphaned raw exports.
- `SR Platform feature/Asset Creation_30fps.mp4` (2,715,363 B), `Spatial Layout Generation1_30fps.mp4` (3,599,382 B), `Simulations & Rollout_30fps.mp4` (2,861,616 B), `Edit In Realtime_30fps.mp4` (2,714,804 B) — the 4 `FEATURES[].videoSrc` entries (`lib/constants.ts:50,59,68,76`), used in `Features.tsx` (both the mobile inline preview and the desktop `800×480` panel).

**Total `public/Video/` payload actually used:** hero (24MB, reused twice) + 4 feature videos (~11.9MB) + 2 community videos (~3.3MB) ≈ **~39MB of video referenced**, plus ~10.4MB of orphaned `Comp *.mp4` files not used anywhere. **The target project has zero video files and no video-serving convention yet** — porting `AutoplayVideo`/`HeroVideoCard`/the feature-video panel means either sourcing equivalent footage for the new (semiconductor-education) domain or temporarily substituting static images/GIFs, since none of Strike's actual video content (robots, simulations) is relevant to a chip-education site.

### Standalone HTML
- `ai-core/index.html` (6,872 B) — a self-contained three.js scene, iframe'd by `about/HeroAICore.tsx`, currently **commented out / not rendered** in `AboutHero.tsx`.

---

## 7. What the target cannot copy directly

1. **Hardcoded English copy, everywhere.** All user-facing strings live as plain English literals in `src/lib/constants.ts` (`SITE_NAME`, `HERO`, `FEATURES`, `ABOUT_MISSION.paragraphs`, `AGENTIC_*`, etc.) and are interpolated directly into JSX with no i18n layer at all (no `next-intl`, no message catalogs, `<html lang="en">` is hardcoded in `layout.tsx:61`). The target project is built on `next-intl` with a `[locale]` App Router segment (confirmed: `src/app/[locale]/...` exists in `Project_Chip_Chip`, and `next.config.mjs` wraps the config in `createNextIntlPlugin`). **Every section component would need its hardcoded string props replaced with `useTranslations()`/message-key lookups**, and `constants.ts`'s plain string objects would need to become locale-aware message files (or be split, keeping only non-text layout data like video paths/colors in `constants.ts`).

2. **Hardcoded routes/anchors.** `NAV_LINKS` (`lib/constants.ts:6-10`) uses bare hash anchors (`#features`, `#cta`) and a bare `/agentic` path; `VIDEO_CTA.sidebarLinks`/`FOOTER.socials`/`ABOUT_HERO.socials` are all `href: "#"` placeholders. The target's real routes use Vietnamese slugs under a locale prefix (`/{locale}/bai-hoc`, `/{locale}/bai-hoc/{topic}`, `/{locale}/dien-dan`, `/{locale}/gioi-thieu`) — none of Strike's nav/link structure maps onto that; the nav and footer link sets need to be rebuilt against the target's actual route tree and wrapped with `next-intl`'s locale-aware `Link`, not copied as-is.

3. **Single-locale layout/typography assumptions.** Golos Text (Latin-only `subsets: ["latin"]`, `layout.tsx:9`) and the local `SuperGround-L3XZ4.ttf` file are both Latin-glyph fonts with no declared Vietnamese-diacritic coverage; **could not determine** (without opening/inspecting the font's own glyph tables) whether either font actually covers Vietnamese diacritics (ă, â, đ, ê, ô, ơ, ư, and the tone-mark combinations). Since the target is bilingual VI/EN and already uses **Be Vietnam Pro** (confirmed in `Project_Chip_Chip/tailwind.config.ts` and its `next/font` setup — not re-verified beyond the config peek in scope for this report) specifically because it covers Vietnamese, swapping in Golos Text/SuperGround risks broken or missing diacritics on Vietnamese copy. This needs an explicit check (render a Vietnamese string in both fonts) before committing to the font swap, or a fallback plan (keep Be Vietnam Pro for body copy, use SuperGround only for short English-safe wordmark words if any survive localization).

4. **Dependency mismatch — target `package.json` (read as part of this report):**
   - Present in both (no action needed): `framer-motion@^12.40.0`, `lenis@^1.3.23`, `lucide-react@^1.17.0`, `next@14.2.35`, `react`/`react-dom@^18`, `clsx@^2.1.1`, `tailwind-merge@^3.6.0`, `tailwindcss@^3.4.1`.
   - **Present in Strike, absent in target — needed for a full port:**
     - `embla-carousel-react@^8.6.0` — required by `agentic/AgenticLayer.tsx`'s mobile carousel (if that section is ported).
     - `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-tooltip`, `class-variance-authority` — all shadcn/ui scaffolding. **Not actually imported by any file under `src/components/**` or `src/app/**`** (not grepped exhaustively per-package, but no shadcn `Dialog`/`Tooltip`/`Label`/`Separator` component files exist in `src/components/ui/` — only the 13 bespoke files inventoried in §3). These look like leftover `create-next-app`/shadcn-init dependencies, safe to leave out of the port unless the target already wants shadcn primitives for other reasons.
     - `vanilla-tilt@^1.8.1` — backs `src/hooks/useVanillaTilt.ts`, which is itself **confirmed unused** (`grep -rl "useVanillaTilt" src` → only its own file). Do not port this dependency or the hook; it's dead weight in the source project too.
   - **Present in target, irrelevant to this port** (Supabase, Tiptap, DOMPurify, next-intl, vitest) — no conflict, just not touched by this work.

5. **Design-system duplication risk with the existing motion library.** `Project_Chip_Chip/src/components/motion/` already has its own `AnimatedButtonLabel.tsx`, `AnimatedSection.tsx`, `MainSection.tsx`, and `StickyBackdrop.tsx` (ported earlier from this same Strike source, per the task brief). Do not re-copy `ui/AnimatedButtonLabel.tsx`, `ui/AnimatedSection.tsx`, `layout/MainSection.tsx`, or the sticky-background pattern (`layout/StickyHeroBackground.tsx`) as new files — the visual-layer port should **reuse those existing motion primitives** rather than duplicate them; only the *visual* layer (colors, fonts, `PillButton`/`GlassPill`/`StarBorder`/video components, section-level markup) is actually missing per the task brief, and this report's §3 confirms `AnimatedButtonLabel`/`AnimatedSection` were dead/unused even in the source, so there's no lost behavior in skipping them again.

6. **Video content is domain-specific and cannot be reused.** As detailed in §6, Strike's videos are all robotics/simulation footage (24MB hero video shared between two products, 4 feature-demo clips, 2 community clips). None of this content is relevant to a semiconductor-education site, and the target currently has **zero** video assets or video-component conventions. Porting `AutoplayVideo`/`HeroVideoCard`/`ScrollVideoReveal` (the components) is straightforward (no domain content baked in), but every `src="..."` prop feeding them will need new footage, or the sections that depend on video (`Hero`, `Features` desktop panel, `Pricing`/Community cards, both page heroes) will need a fallback design (static image/illustration) until real video exists.

7. **`.svg`/PNG icon duplication and dead assets** (see §6 for the full list — `images/Logo.png`, `images/feature-screenshot.png`, `Logo_button.png`, `end_one_layer.png`, `about/Logo.png`, `about/hero-effect.jpg`, `about/{layer-3,partner-base,partner-reppo,partner-virtuals}.png`, `agentic/parts/*.png`, `Video/Comp {1,2,3}.mp4`, `icons/features/*.png` siblings of the used `.svg`s) — **do not port these blindly**; audit against actual `grep` usage (as done in §6) before copying, or the target inherits the same dead-weight problem.

8. **Copyright/legal string.** `FOOTER.copyright` (`lib/constants.ts:141-142`) hardcodes `"© 2026 DSC Labs. All rights reserved. SR Platform™ is a trademark of DSC Labs."` — obviously must be replaced, not copied, along with all other StrikeRobot/DSC Labs/SR Platform/SR Agentic brand naming baked into `constants.ts`, `metadata` blocks in each `page.tsx`, and `SITE_NAME`/`SITE_TAGLINE`/`SITE_DESCRIPTION`.
