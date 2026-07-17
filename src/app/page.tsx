"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { PlayerPanel } from "@/components/PlayerPanel";
import { VideoListItem } from "@/components/VideoListItem";
import { FeedbackPoll } from "@/components/FeedbackPoll";
import { LOFI_STREAM } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import type { LiveStream } from "@/lib/invidious";

type SortOrder = "desc" | "asc";

// Fecha efectiva para ordenar: inicio del live, o publicación como respaldo
const sortKey = (s: LiveStream) => s.liveStartedAt ?? s.publishedAt ?? "";

export default function Home() {
  const { streams, loading, error, refresh } = useLiveStreams();
  // Video elegido explícitamente por el usuario (con clic); null = automático
  const [chosen, setChosen] = useState<LiveStream | null>(null);
  const [order, setOrder] = useState<SortOrder>("desc");
  // ?v= leído una sola vez; en el servidor no existe window y queda null
  const [requestedId] = useState(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("v")
  );

  const liveNow = useMemo(() => streams.filter((s) => s.isLive), [streams]);

  const past = useMemo(() => {
    const rest = streams.filter((s) => !s.isLive);
    return [...rest].sort((a, b) =>
      order === "desc"
        ? sortKey(b).localeCompare(sortKey(a))
        : sortKey(a).localeCompare(sortKey(b))
    );
  }, [streams, order]);

  // Selección derivada (sin estado extra): clic del usuario → deep-link ?v= →
  // Platzi live activo → radio lofi. Mientras no haya clic, un live que
  // empiece toma el reproductor automáticamente.
  const displayed = useMemo(() => {
    if (chosen) return chosen;
    if (loading && streams.length === 0) return null; // primera carga
    if (requestedId) {
      if (requestedId === LOFI_STREAM.videoId) return LOFI_STREAM;
      const match = streams.find((s) => s.videoId === requestedId);
      if (match) return match;
    }
    return liveNow[0] ?? LOFI_STREAM;
  }, [chosen, loading, streams, liveNow, requestedId]);

  // Registra el video servido automáticamente (los clics se registran aparte)
  const lastTracked = useRef<string | null>(null);
  useEffect(() => {
    if (!displayed || lastTracked.current === displayed.videoId) return;
    const isFirst = lastTracked.current === null;
    lastTracked.current = displayed.videoId;
    if (chosen) return;
    trackEvent(
      displayed.videoId,
      isFirst && requestedId === displayed.videoId ? "play" : "autoplay_default"
    );
  }, [displayed, chosen, requestedId]);

  function handleSelect(stream: LiveStream) {
    setChosen(stream);
    trackEvent(stream.videoId, "play");
    // deep-link compartible sin recargar
    const url = new URL(window.location.href);
    url.searchParams.set("v", stream.videoId);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    // En lg+ la página ocupa exactamente el viewport: el reproductor queda fijo
    // y cada columna hace scroll por su cuenta solo si su contenido no cabe.
    <div className="flex min-h-screen flex-col lg:h-dvh">
      {/* Barra superior (glass) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e1013]/80 bg-gradient-to-b from-white/[0.06] to-transparent backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">
              Platzi <span className="text-[#0aeb8b]">Live</span>
            </h1>
            {liveNow.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-400 ring-1 ring-red-600/40">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                En vivo
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-[#0aeb8b]/30 bg-transparent px-4 py-2 text-sm font-medium text-[#0aeb8b] transition hover:bg-[#0aeb8b]/10 disabled:opacity-50"
          >
            {loading ? "Buscando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
        {error && (
          <div className="mb-5 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-300 ring-1 ring-red-700/50">
            No se pudo comprobar el canal ahora mismo: {error}. Mostrando el
            histórico guardado.
          </div>
        )}

        <div className="grid gap-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_430px]">
          {/* Reproductor principal: fijo; solo scrollea si su contenido no cabe */}
          <div className="custom-scroll lg:min-h-0 lg:overflow-y-auto lg:pr-2">
            {displayed ? (
              <PlayerPanel stream={displayed} autoplay={chosen !== null} />
            ) : (
              <div className="aspect-video w-full animate-pulse rounded-xl bg-[#14171c]" />
            )}
          </div>

          {/* Lista lateral: panel glass que marca la zona con scroll */}
          <aside className="glass backdrop-blur-md custom-scroll flex flex-col gap-10 rounded-2xl p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto">
            <section aria-label="En vivo ahora">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                En vivo ahora
              </h2>
              <div className="flex flex-col gap-3">
                {liveNow.map((s) => (
                  <VideoListItem
                    key={s.videoId}
                    stream={s}
                    active={displayed?.videoId === s.videoId}
                    onSelect={handleSelect}
                    badge="EN VIVO"
                  />
                ))}
                <VideoListItem
                  stream={LOFI_STREAM}
                  active={displayed?.videoId === LOFI_STREAM.videoId}
                  onSelect={handleSelect}
                  badge="24/7"
                />
              </div>
            </section>

            <section aria-label="Lives anteriores">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300">
                  Lives anteriores
                </h2>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as SortOrder)}
                  aria-label="Ordenar lives"
                  className="rounded-lg bg-[#14171c] px-3 py-1.5 text-xs text-gray-300 ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
                >
                  <option value="desc">Más recientes primero</option>
                  <option value="asc">Más antiguos primero</option>
                </select>
              </div>

              {loading && streams.length === 0 ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-xl bg-[#14171c]"
                    />
                  ))}
                </div>
              ) : past.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aún no hay lives guardados. Cuando Platzi transmita, aparecerá
                  aquí automáticamente.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {past.map((s) => (
                    <VideoListItem
                      key={s.videoId}
                      stream={s}
                      active={displayed?.videoId === s.videoId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1500px] px-4 pb-8 pt-4 text-center text-xs text-gray-600 sm:px-4">
        Los videos se reproducen directamente desde YouTube. Este sitio solo
        organiza los enlaces públicos del canal de Platzi.
      </footer>

      {/* Encuesta flotante (esquina inferior derecha) */}
      <FeedbackPoll />
    </div>
  );
}
