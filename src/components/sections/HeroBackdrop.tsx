"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ExternalLink, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * A muted looping clip behind a page hero, with a way to stop it (WCAG 2.2.2:
 * moving content that starts by itself and lasts over five seconds must be
 * pausable). It comes in three parts that share one playing state: the
 * provider, the layer that draws the video, and the credit row with the button.
 * PageHero puts the layer behind its title and the row underneath it.
 *
 * Under prefers-reduced-motion the clip never starts by itself; the first frame
 * shows, the button reads "Play" and still plays it on request.
 */

type Backdrop = {
  videoRef: RefObject<HTMLVideoElement>;
  playing: boolean;
  toggle: () => void;
  /** Set by the layer once the first frame is drawn. */
  ready: boolean;
  setReady: (ready: boolean) => void;
  /** True once the reader has pressed pause: the clip then stays stopped. */
  userPaused: RefObject<boolean>;
  setPlaying: (playing: boolean) => void;
};

const BackdropContext = createContext<Backdrop | null>(null);

function useBackdrop(): Backdrop {
  const value = useContext(BackdropContext);
  if (!value) throw new Error("HeroBackdrop parts must be inside <HeroBackdropProvider>");
  return value;
}

export function HeroBackdropProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  }, []);

  const value = useMemo(
    () => ({ videoRef, playing, toggle, ready, setReady, userPaused, setPlaying }),
    [playing, toggle, ready]
  );

  return <BackdropContext.Provider value={value}>{children}</BackdropContext.Provider>;
}

/** The video, faded to 25% and washed out by a scrim so the text above stays readable. */
export function HeroBackdropLayer({ src, className }: { src: string; className?: string }) {
  const { videoRef, ready, setReady, setPlaying, userPaused } = useBackdrop();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onReady = () => setReady(true);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("loadeddata", onReady);
    if (video.readyState >= 2) setReady(true);

    // Play while on screen, stop while off it, unless the reader stopped it.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!reduce && !userPaused.current) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("loadeddata", onReady);
    };
  }, [videoRef, setPlaying, setReady, userPaused]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        className={cn(
          "size-full object-cover transition-opacity duration-base ease-standard motion-reduce:transition-none",
          ready ? "opacity-25" : "opacity-0"
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(229,229,229,.78)_0%,rgba(229,229,229,.5)_45%,rgba(229,229,229,0)_75%),linear-gradient(180deg,rgba(229,229,229,0)_0%,rgba(229,229,229,.4)_55%,#E5E5E5_100%)]" />
    </div>
  );
}

/** The pause/play button and the line saying where the clip comes from. */
export function HeroBackdropCredit({
  credit,
  className,
}: {
  credit: { label: string; href: string };
  className?: string;
}) {
  const { playing, toggle } = useBackdrop();
  const t = useTranslations("forum");
  const tCommon = useTranslations("common");

  return (
    <div className={cn("flex items-center gap-3 text-[13px] leading-[1.45] text-text-muted", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("backdropPause") : t("backdropPlay")}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-surface text-text-nav transition-colors duration-fast ease-standard hover:border-black/25 hover:text-black motion-reduce:transition-none"
      >
        {playing ? (
          <Pause aria-hidden className="size-4" strokeWidth={2} />
        ) : (
          <Play aria-hidden className="size-4" strokeWidth={2} />
        )}
      </button>
      <p>
        {tCommon("videoCredit")}{" "}
        <a
          href={credit.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("creditLink", { title: credit.label })}
          className="inline-flex min-h-11 items-center gap-1.5 underline underline-offset-[3px] hover:text-accent"
        >
          {credit.label}
          <ExternalLink aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
        </a>
      </p>
    </div>
  );
}
