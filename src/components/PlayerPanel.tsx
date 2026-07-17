"use client";

import type { LiveStream } from "@/lib/invidious";
import { StatusBadge } from "./StatusBadge";
import { formatDate, timeAgo } from "@/lib/dates";
import { trackEvent } from "@/lib/analytics";

interface PlayerPanelProps {
  stream: LiveStream;
  /** true cuando el usuario eligió el video con un clic (permite autoplay) */
  autoplay: boolean;
}

export function PlayerPanel({ stream, autoplay }: PlayerPanelProps) {
  const embedSrc = `https://www.youtube.com/embed/${stream.videoId}?rel=0&autoplay=${autoplay ? 1 : 0}`;
  const dateIso = stream.liveStartedAt ?? stream.publishedAt;
  const relative = timeAgo(dateIso);
  const absolute = formatDate(dateIso);

  return (
    <section aria-label="Reproductor">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10">
        <iframe
          key={embedSrc} /* re-monta el iframe al cambiar de video */
          src={embedSrc}
          title={stream.title}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <h1 className="text-lg font-bold leading-snug text-white sm:text-xl">
          {stream.title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span className="font-semibold text-white">{stream.channelTitle}</span>
            {stream.isLive ? (
              <StatusBadge />
            ) : (
              relative && (
                <span>
                  Transmitido {relative}
                  {absolute && <span className="text-gray-500"> · {absolute}</span>}
                </span>
              )
            )}
          </div>
          <a
            href={stream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(stream.videoId, "open_youtube")}
            className="rounded-lg border border-[#98ca3f]/30 px-4 py-2 text-sm font-semibold text-[#98ca3f] transition hover:bg-[#98ca3f]/10 active:scale-95"
          >
            Ver en YouTube ↗
          </a>
        </div>
      </div>
    </section>
  );
}
