"use client";

import { useEffect, useRef, useState } from "react";
import { PlayerPanel } from "@/components/PlayerPanel";
import { VideoListItem } from "@/components/VideoListItem";
import { trackEvent } from "@/lib/analytics";
import type { Playable } from "@/lib/types";

// Detalle de un recurso. Para un video suelto, solo el reproductor. Para una
// playlist, reproductor + lista de episodios (mismo layout que Platzi Lives),
// reutilizando PlayerPanel y VideoListItem sin cambios.
export function ResourceDetail({
  main,
  episodes,
}: {
  main: Playable;
  episodes: Playable[] | null;
}) {
  const isPlaylist = episodes !== null && episodes.length > 0;
  const [chosen, setChosen] = useState<Playable | null>(null);
  const displayed = chosen ?? (isPlaylist ? episodes[0] : main);

  // Registra el video mostrado: clic → "play"; carga automática → "autoplay_default".
  const lastTracked = useRef<string | null>(null);
  useEffect(() => {
    if (!displayed || lastTracked.current === displayed.videoId) return;
    const clicked = chosen !== null;
    lastTracked.current = displayed.videoId;
    trackEvent(displayed.videoId, clicked ? "play" : "autoplay_default");
  }, [displayed, chosen]);

  function select(ep: Playable) {
    setChosen(ep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isPlaylist) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PlayerPanel stream={main} autoplay={false} dateVerb="Publicado" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_430px]">
      <div>
        <PlayerPanel stream={displayed} autoplay={chosen !== null} dateVerb="Publicado" />
      </div>
      <aside className="glass backdrop-blur-md custom-scroll flex max-h-[75vh] flex-col gap-3 rounded-2xl p-4 sm:p-5 lg:overflow-y-auto">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300">
          Episodios <span className="text-gray-500">({episodes.length})</span>
        </h2>
        {episodes.map((ep) => (
          <VideoListItem
            key={ep.videoId}
            stream={ep}
            active={displayed.videoId === ep.videoId}
            onSelect={select}
          />
        ))}
      </aside>
    </div>
  );
}
