"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResourceRow } from "@/lib/types";
import { formatDuration, timeAgo } from "@/lib/dates";

// Tarjeta del catálogo (grid). Enlaza al detalle del recurso; `from` alimenta el
// breadcrumb de vuelta. `accent` (color de la categoría) tiñe el marco y el
// distintivo de tipo, para que el color de cada área se lea en las tarjetas.
export function ResourceCard({
  resource,
  from,
  accent,
}: {
  resource: ResourceRow;
  from?: string;
  accent?: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = imgError
    ? `https://i.ytimg.com/vi/${resource.youtube_id}/hqdefault.jpg`
    : resource.thumbnail_url ??
      `https://i.ytimg.com/vi/${resource.youtube_id}/maxresdefault.jpg`;

  const isPlaylist = resource.kind === "playlist";
  const href = `/recurso/${resource.youtube_id}${from ? `?from=${encodeURIComponent(from)}` : ""}`;
  const line = accent || "var(--accent)";

  const meta = isPlaylist
    ? `${resource.video_count ?? 0} ${resource.video_count === 1 ? "video" : "videos"}`
    : formatDuration(resource.duration_seconds) ?? timeAgo(resource.published_at) ?? "";

  return (
    <Link
      href={href}
      style={{ ["--line" as string]: line }}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border transition hover:ring-2 hover:ring-[var(--line)]"
    >
      {/* Marca de color de la categoría en el borde superior */}
      <span
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: line }}
        aria-hidden="true"
      />

      <div className="relative aspect-video w-full overflow-hidden bg-elevated">
        {resource.thumbnail_url || resource.kind === "video" ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized={imgError}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-faint">
              Playlist
            </span>
          </div>
        )}
        {isPlaylist && (
          <span
            className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent"
            style={{ backgroundColor: line }}
          >
            {resource.video_count ?? 0} videos
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {resource.title}
        </h3>
        {resource.channel_title && (
          <p className="truncate text-xs text-muted">{resource.channel_title}</p>
        )}
        {meta && <p className="mt-auto pt-1 text-xs text-faint">{meta}</p>}
      </div>
    </Link>
  );
}
