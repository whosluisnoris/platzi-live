"use client";

import { useState } from "react";
import type { LiveStream } from "@/lib/invidious";

interface AddStreamFormProps {
  onAdd: (stream: LiveStream) => void;
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("?")[0];
    }
  } catch {
    // Not a URL — try raw video ID
  }
  const clean = input.trim();
  if (VIDEO_ID_RE.test(clean)) return clean;
  return null;
}

export function AddStreamForm({ onAdd }: AddStreamFormProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const videoId = extractVideoId(value.trim());
    if (!videoId) {
      setError("Paste a valid YouTube URL or video ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/oembed?videoId=${videoId}`);
      const data = await res.json();

      const stream: LiveStream = {
        videoId,
        title: data.title ?? "Platzi Live",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        channelTitle: data.channelTitle ?? "Platzi",
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      };

      onAdd(stream);
      setValue("");
    } catch {
      setError("Failed to fetch video info — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste YouTube URL or video ID…"
        className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:outline-none focus:ring-white/30"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add Stream"}
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
