"use client";

import { useState } from "react";
import Image from "next/image";
import type { LiveStream } from "@/lib/invidious";
import { StatusBadge } from "./StatusBadge";
import { EmbedModal } from "./EmbedModal";

interface LiveCardProps {
  stream: LiveStream;
}

export function LiveCard({ stream }: LiveCardProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [imgError, setImgError] = useState(false);

  const thumbnailUrl = imgError
    ? `https://i.ytimg.com/vi/${stream.videoId}/hqdefault.jpg`
    : stream.thumbnailUrl;

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-lg ring-1 ring-[#98ca3f]/20 transition hover:ring-[#98ca3f]/50">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full">
          <Image
            src={thumbnailUrl}
            alt={stream.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized={imgError}
          />
          <div className="absolute left-3 top-3">
            <StatusBadge />
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h2 className="line-clamp-2 text-base font-semibold text-white">
            {stream.title}
          </h2>
          <p className="mt-1 text-sm text-gray-400">{stream.channelTitle}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => setShowEmbed(true)}
            className="flex-1 rounded-lg bg-[#98ca3f] px-4 py-2 text-sm font-semibold text-[#0d0d0d] transition hover:bg-[#aad44f] active:scale-95"
          >
            Watch Here
          </button>
          <a
            href={stream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-[#98ca3f]/30 bg-transparent px-4 py-2 text-center text-sm font-semibold text-[#98ca3f] transition hover:bg-[#98ca3f]/10 active:scale-95"
          >
            Open on YouTube
          </a>
        </div>
      </div>

      {showEmbed && (
        <EmbedModal
          embedUrl={stream.embedUrl}
          title={stream.title}
          onClose={() => setShowEmbed(false)}
        />
      )}
    </>
  );
}
