"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PLATFORM_LABEL, embedUrl, videoRefFrom } from "@/lib/video";

/**
 * Swaps a video facade (see src/lib/tiptap/video-embed.ts) for the player
 * when the reader clicks it.
 *
 * The facades arrive as HTML through `dangerouslySetInnerHTML`, so React
 * never sees them as elements: one listener on the document handles them
 * all. The player address is rebuilt from the validated (platform, id), never
 * read from the page. Modified clicks fall through to the link, which opens
 * the video on its own site — as it does when JavaScript is off.
 */
export function VideoFacades() {
  const t = useTranslations("forum");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const facade = event.target.closest<HTMLAnchorElement>("a.video-facade");
      if (!facade) return;
      const ref = videoRefFrom(facade.dataset.videoPlatform, facade.dataset.videoId);
      if (!ref) return;

      event.preventDefault();
      const frame = document.createElement("iframe");
      // Autoplay only because the reader just pressed play on the facade.
      frame.src = ref.platform === "youtube" ? `${embedUrl(ref)}?autoplay=1` : embedUrl(ref);
      frame.title = t("videoFrameTitle", { platform: PLATFORM_LABEL[ref.platform] });
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.setAttribute("loading", "lazy");
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.className = "video-frame";
      facade.replaceWith(frame);
      frame.focus();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [t]);

  return null;
}
