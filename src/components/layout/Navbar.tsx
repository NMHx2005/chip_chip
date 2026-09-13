"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { Logo } from "@/components/layout/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { DURATION, EASE_STANDARD } from "@/components/motion";
import { GlassPill } from "@/components/ui/GlassPill";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { PillButtonCta } from "@/components/ui/PillButton";
import { Link, usePathname } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const t = useTranslations("nav");
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

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors",
                        active
                          ? "text-white"
                          : "text-text-nav hover:bg-brand-500/8 hover:text-brand-700"
                      )}
                    >
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-brand-500"
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
            <SocialLinks className="hidden md:flex" />
            <LangSwitch className="hidden sm:flex" />
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
            className="fixed inset-0 z-[1001] flex flex-col bg-brand-900 lg:hidden"
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

            <nav className="mt-4 flex-1 px-3" aria-label={t("openMenu")}>
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block border-b border-white/10 px-4 py-5 text-xl tracking-[-0.01em] transition-colors",
                      active ? "text-white" : "text-white/70"
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-5 px-6 pb-10">
              <div className="flex items-center justify-between">
                <LangSwitch
                  variant="dark"
                  onSwitch={() => setMobileOpen(false)}
                />
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
