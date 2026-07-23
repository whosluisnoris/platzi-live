"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResourceRow } from "@/lib/types";
import { formatDuration, timeAgo } from "@/lib/dates";

// Tarjeta del catálogo (grid). Enlaza al detalle del recurso; `from` alimenta el
// breadcrumb de vuelta ("← Volver a {origen}").
export function ResourceCard({
  resource,
  from,
}: {
  resource: ResourceRow;
  from?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = imgError
    ? `https://i.ytimg.com/vi/${resource.youtube_id}/hqdefault.jpg`
    : resource.thumbnail_url ??
      `https://i.ytimg.com/vi/${resource.youtube_id}/maxresdefault.jpg`;

  const isPlaylist = resource.kind === "playlist";
  const href = `/recurso/${resource.youtube_id}${from ? `?from=${encodeURIComponent(from)}` : ""}`;

  const meta = isPlaylist
    ? `${resource.video_count ?? 0} ${resource.video_count === 1 ? "video" : "videos"}`
    : formatDuration(resource.duration_seconds) ?? timeAgo(resource.published_at) ?? "";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl bg-[#14171c] ring-1 ring-white/10 transition hover:ring-[#0aeb8b]/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#0e1013]">
        {/* Miniatura solo si hay algo que mostrar (playlist vacía → placeholder) */}
        {resource.thumbnail_url || resource.kind === "video" ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized={imgError}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-gray-700">
            📚
          </div>
        )}
        {isPlaylist && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            ☰ Playlist
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-[#0aeb8b]">
          {resource.title}
        </h3>
        {resource.channel_title && (
          <p className="truncate text-xs text-gray-400">{resource.channel_title}</p>
        )}
        {meta && <p className="mt-auto pt-1 text-xs text-gray-500">{meta}</p>}
      </div>
    </Link>
  );
}
