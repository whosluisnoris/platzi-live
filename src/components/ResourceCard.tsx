"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResourceRow } from "@/lib/types";
import type { CategoryTag } from "@/lib/catalog";
import { formatDuration, timeAgo } from "@/lib/dates";
import { VoteControl } from "@/components/VoteControl";

// Tarjeta del catálogo (grid). El enlace envuelve la miniatura y el título; el
// control de voto vive en un pie aparte para no anidar botones dentro de un <a>.
// `accent` (color de la categoría) tiñe el marco y el distintivo de tipo.
// `categories` muestra a qué filtro(s) pertenece el video.
export function ResourceCard({
  resource,
  from,
  accent,
  userVote,
  canVote = false,
  categories,
}: {
  resource: ResourceRow;
  from?: string;
  accent?: string | null;
  userVote?: number;
  canVote?: boolean;
  categories?: CategoryTag[];
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
    <div
      style={{ ["--line" as string]: line }}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border transition hover:ring-2 hover:ring-[var(--line)]"
    >
      {/* Marca de color de la categoría en el borde superior */}
      <span
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: line }}
        aria-hidden="true"
      />

      <Link href={href} className="flex flex-1 flex-col">
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

        <div className="flex flex-1 flex-col gap-1 p-3.5 pb-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {resource.title}
          </h3>
          {resource.channel_title && (
            <p className="truncate text-xs text-muted">{resource.channel_title}</p>
          )}
          {categories && categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {categories.slice(0, 2).map((c) => (
                <span
                  key={c.slug}
                  className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-border"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: c.color ?? "var(--accent)" }}
                    aria-hidden="true"
                  />
                  {c.name}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-faint">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
        <VoteControl
          resourceId={resource.id}
          score={resource.vote_count}
          initialVote={userVote}
          canVote={canVote}
        />
        {meta && <span className="text-xs text-faint">{meta}</span>}
      </div>
    </div>
  );
}
