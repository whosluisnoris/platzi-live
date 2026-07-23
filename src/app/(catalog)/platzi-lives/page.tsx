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

// Fecha para ordenar: el inicio real de la transmisión
const sortKey = (s: LiveStream) => s.liveStartedAt ?? "";

// Pestaña "Platzi Lives": el histórico de lives con detección automática, tal
// como funcionaba en la home original. La marca y las pestañas viven ahora en el
// layout compartido del catálogo; aquí queda su barra propia (EN VIVO / Actualizar).
export default function PlatziLivesPage() {
  const { streams, loading, error, refresh } = useLiveStreams();
  const [chosen, setChosen] = useState<LiveStream | null>(null);
  const [order, setOrder] = useState<SortOrder>("desc");
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

  const displayed = useMemo(() => {
    const live = liveNow[0] ?? null;
    if (chosen) {
      if (live && chosen.videoId === LOFI_STREAM.videoId) return live;
      return chosen;
    }
    if (loading && streams.length === 0) return null;
    if (requestedId) {
      if (requestedId === LOFI_STREAM.videoId) return live ?? LOFI_STREAM;
      const match = streams.find((s) => s.videoId === requestedId);
      if (match) return match;
    }
    return live ?? LOFI_STREAM;
  }, [chosen, loading, streams, liveNow, requestedId]);

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
    const url = new URL(window.location.href);
    url.searchParams.set("v", stream.videoId);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-8">
      {/* Barra propia de la pestaña */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Platzi Lives</h1>
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
          className="rounded-lg border border-accent/30 bg-transparent px-4 py-2 text-sm font-medium text-accent-ink transition hover:bg-accent/10 disabled:opacity-50"
        >
          {loading ? "Buscando…" : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-300 ring-1 ring-red-700/50">
          No se pudo comprobar el canal ahora mismo: {error}. Mostrando el
          histórico guardado.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_430px]">
        {/* Reproductor principal */}
        <div>
          {displayed ? (
            <PlayerPanel stream={displayed} autoplay={chosen !== null} />
          ) : (
            <div className="aspect-video w-full animate-pulse rounded-xl bg-surface" />
          )}
        </div>

        {/* Lista lateral */}
        <aside className="glass backdrop-blur-md custom-scroll flex flex-col gap-10 rounded-2xl p-4 sm:p-5 lg:max-h-[80vh] lg:overflow-y-auto">
          <section aria-label="En vivo ahora">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
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
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                Lives anteriores
              </h2>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as SortOrder)}
                aria-label="Ordenar lives"
                className="rounded-lg bg-surface px-3 py-1.5 text-xs text-muted ring-1 ring-border focus:outline-none focus:ring-accent/50"
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguos primero</option>
              </select>
            </div>

            {loading && streams.length === 0 ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
                ))}
              </div>
            ) : past.length === 0 ? (
              <p className="text-sm text-faint">
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

      {/* Encuesta flotante: su pregunta es sobre Platzi Lives, así que solo
          se muestra en esta ruta (no en el resto del catálogo). */}
      <FeedbackPoll />
    </main>
  );
}
