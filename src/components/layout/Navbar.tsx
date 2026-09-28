"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { LessonsMenu } from "@/components/layout/LessonsMenu";
import { Logo } from "@/components/layout/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { DURATION, EASE_STANDARD } from "@/components/motion";
import { SearchBox } from "@/components/search/SearchBox";
import { SearchForm } from "@/components/search/SearchForm";
import { GlassPill } from "@/components/ui/GlassPill";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { PillButtonCta } from "@/components/ui/PillButton";
import { Link, getPathname, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { LESSON_SUBNAV, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * `LangSwitch` reads `useSearchParams`, which forces a Suspense boundary in a
 * statically rendered tree. There is none today, but the navbar is on every
 * page — this keeps a future static page from breaking on it. Same box model
 * as `LangSwitch` (rounded pill, two `px-2.5 py-1 text-[11px]` labels) so the
 * bar does not jump once the real one mounts.
 */
function LangSwitchFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex items-center rounded-full bg-surface-muted p-0.5", className)}
    >
      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        VI
      </span>
      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        EN
      </span>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const t = useTranslations("nav");
  const tSearch = useTranslations("search");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Frost the bar once the page has moved, so the hero reads as full-bleed.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[1000] transition-colors duration-300",
          scrolled
            ? "border-b border-border/70 bg-bg/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-5 py-3.5 md:px-8 md:py-4">
          <Link
            href="/"
            className="shrink-0"
            aria-label={t("home")}
            onClick={() => setMobileOpen(false)}
          >
            <Logo className="text-[19px] md:text-[22px]" />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:block">
            <GlassPill radius={999}>
              <nav
                className="flex items-center gap-1 px-1.5 py-1.5"
                aria-label={t("home")}
              >
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);

                  if (item.key === "lessons") {
                    return (
                      <LessonsMenu
                        key={item.key}
                        active={LESSON_SUBNAV.some((sub) => isActive(pathname, sub.href))}
                      />
                    );
                  }

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors",
                        active
                          ? "text-white"
                          : "text-text-nav hover:bg-surface-muted hover:text-accent"
                      )}
                    >
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-primary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: prefersReducedMotion ? 0 : DURATION.fast,
                              ease: EASE_STANDARD,
                            }}
                            aria-hidden="true"
                          />
                        )}
                      </AnimatePresence>
                      <span className="relative z-10">{t(item.key)}</span>
                    </Link>
                  );
                })}
              </nav>
            </GlassPill>
          </div>

          <div className="flex items-center gap-3">
            <SearchBox className="hidden lg:block" />
            <SocialLinks className="hidden md:flex" />
            <Suspense fallback={<LangSwitchFallback className="hidden sm:flex" />}>
              <LangSwitch className="hidden sm:flex" />
            </Suspense>
            <PillButtonCta href="/gioi-thieu" className="hidden md:inline-flex">
              {t("join")}
            </PillButtonCta>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("openMenu")}
              aria-expanded={mobileOpen}
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface lg:hidden"
            >
              <MenuIcon className="size-5 text-text" />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer so content is not hidden behind the fixed bar */}
      <div aria-hidden className="h-[68px] md:h-[76px]" />

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("openMenu")}
            className="fixed inset-0 z-[1001] flex flex-col bg-primary lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <div className="flex items-center justify-between px-5 py-3.5">
              <Logo className="text-[19px] text-white" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t("closeMenu")}
                className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5"
              >
                <X className="size-5 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-2 px-5">
              <SearchForm
                action={getPathname({ href: "/tim-kiem", locale })}
                label={tSearch("label")}
                placeholder={tSearch("placeholder")}
                submitLabel={tSearch("submit")}
                variant="dark"
              />
            </div>

            <nav className="mt-4 flex-1 overflow-y-auto px-3" aria-label={t("openMenu")}>
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <div key={item.key} className="border-b border-white/10">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block px-4 py-5 text-xl tracking-[-0.01em] transition-colors",
                        active ? "text-white" : "text-white/70"
                      )}
                    >
                      {t(item.key)}
                    </Link>

                    {item.key === "lessons" && (
                      <ul className="-mt-2 pb-3 pl-8">
                        {LESSON_SUBNAV.map((sub) => {
                          const subActive = isActive(pathname, sub.href);
                          return (
                            <li key={sub.key}>
                              <Link
                                href={sub.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={subActive ? "page" : undefined}
                                className={cn(
                                  "flex min-h-11 items-center text-base transition-colors",
                                  subActive ? "text-white" : "text-white/70"
                                )}
                              >
                                {t(sub.key)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex flex-col gap-5 px-6 pb-10">
              <div className="flex items-center justify-between">
                <Suspense fallback={<LangSwitchFallback />}>
                  <LangSwitch
                    variant="dark"
                    onSwitch={() => setMobileOpen(false)}
                  />
                </Suspense>
                <SocialLinks variant="dark" />
              </div>

              <PillButtonCta
                href="/gioi-thieu"
                className="w-full"
                onClick={() => setMobileOpen(false)}
              >
                {t("join")}
              </PillButtonCta>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
