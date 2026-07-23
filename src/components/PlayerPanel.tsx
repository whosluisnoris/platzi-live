"use client";

import type { LiveStream } from "@/lib/invidious";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatDuration, timeAgo } from "@/lib/dates";
import { trackEvent } from "@/lib/analytics";

interface PlayerPanelProps {
  stream: LiveStream;
  /** true cuando el usuario eligió el video con un clic (permite autoplay) */
  autoplay: boolean;
  /** Verbo para la fecha de un video no-live ("Transmitido" en lives, "Publicado" en el catálogo) */
  dateVerb?: string;
}

export function PlayerPanel({ stream, autoplay, dateVerb = "Transmitido" }: PlayerPanelProps) {
  const embedSrc = `https://www.youtube.com/embed/${stream.videoId}?rel=0&autoplay=${autoplay ? 1 : 0}`;
  const dateIso = stream.liveStartedAt;
  const relative = timeAgo(dateIso);
  const absolute = formatDate(dateIso);
  const duration = formatDuration(stream.durationSeconds);

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

      <div className="mt-5 flex flex-col gap-3">
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
                  {dateVerb} {relative}
                  {absolute && <span className="text-gray-500"> · {absolute}</span>}
                  {duration && <span className="text-gray-500"> · {duration}</span>}
                </span>
              )
            )}
          </div>
          <a
            href={stream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(stream.videoId, "open_youtube")}
            className="rounded-lg border border-[#0aeb8b]/30 px-4 py-2 text-sm font-semibold text-[#0aeb8b] transition hover:bg-[#0aeb8b]/10 active:scale-95"
          >
            Ver en YouTube ↗
          </a>
        </div>
      </div>
    </section>
  );
}
