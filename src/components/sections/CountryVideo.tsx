"use client";

import { useState } from "react";
import type { CountryBand } from "@/lib/constants";
import { youtubeClipEmbedUrl } from "@/lib/video";

/** Click-to-play: no iframe (and no request to YouTube's player) until asked. */
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
            className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
          />
          <span
            aria-hidden
            className="relative grid size-12 place-items-center rounded-full bg-white/90 text-black"
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
