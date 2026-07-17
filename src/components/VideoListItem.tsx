"use client";

import { useState } from "react";
import Image from "next/image";
import type { LiveStream } from "@/lib/invidious";
import { formatDuration, timeAgo } from "@/lib/dates";

interface VideoListItemProps {
  stream: LiveStream;
  active: boolean;
  onSelect: (stream: LiveStream) => void;
  /** Etiqueta sobre la miniatura: "EN VIVO" o "24/7" */
  badge?: string;
}

export function VideoListItem({ stream, active, onSelect, badge }: VideoListItemProps) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = imgError
    ? `https://i.ytimg.com/vi/${stream.videoId}/hqdefault.jpg`
    : stream.thumbnailUrl;
  const relative = timeAgo(stream.liveStartedAt ?? stream.publishedAt);
  const duration = formatDuration(stream.durationSeconds);

  return (
    <button
      onClick={() => onSelect(stream)}
      aria-current={active ? "true" : undefined}
      className={`group flex w-full gap-3.5 rounded-xl p-2.5 text-left transition ${
        active
          ? "bg-[#0aeb8b]/10 ring-1 ring-[#0aeb8b]/40"
          : "hover:bg-white/5"
      }`}
    >
      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-[#14171c]">
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          sizes="160px"
          className="object-cover transition group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized={imgError}
        />
        {badge && (
          <span
            className={`absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              badge === "EN VIVO"
                ? "bg-red-600 text-white"
                : "bg-black/80 text-[#0aeb8b]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1 py-0.5">
        <h3
          className={`line-clamp-2 text-sm font-semibold leading-snug ${
            active ? "text-[#0aeb8b]" : "text-white"
          }`}
        >
          {stream.title}
        </h3>
        <p className="text-xs text-gray-400">{stream.channelTitle}</p>
        {(relative || duration) && (
          <p className="text-xs text-gray-500">
            {relative}
            {relative && duration && " · "}
            {duration}
          </p>
        )}
      </div>
    </button>
  );
}
