"use client";

import { useEffect, useRef, useState } from "react";
import { PlayerPanel } from "@/components/PlayerPanel";
import { VideoListItem } from "@/components/VideoListItem";
import { trackEvent } from "@/lib/analytics";
import type { Playable } from "@/lib/types";
import { useT } from "@/components/I18nProvider";
import { Card, SectionHeader } from "@/components/ui";

// Detalle de un recurso. Para un video suelto, solo el reproductor. Para una
// playlist, reproductor + lista lateral de episodios
// (PlayerPanel y VideoListItem).
export function ResourceDetail({
  main,
  episodes,
}: {
  main: Playable;
  episodes: Playable[] | null;
}) {
  const t = useT();
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
        <PlayerPanel stream={main} autoplay={false} dateVerb={t.resource.publishedVerb} />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_430px]">
      <div>
        <PlayerPanel
          stream={displayed}
          autoplay={chosen !== null}
          dateVerb={t.resource.publishedVerb}
        />
      </div>
      <Card
        as="aside"
        variant="glass"
        padding="none"
        className="custom-scroll flex max-h-[75vh] flex-col gap-3 overflow-y-auto p-4 sm:p-5"
      >
        <SectionHeader
          size="sm"
          title={
            <>
              {t.resource.episodes} <span className="text-faint">({episodes.length})</span>
            </>
          }
        />
        {episodes.map((ep) => (
          <VideoListItem
            key={ep.videoId}
            stream={ep}
            active={displayed.videoId === ep.videoId}
            onSelect={select}
          />
        ))}
      </Card>
    </div>
  );
}
