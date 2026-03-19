"use client";

import { useState, useEffect } from "react";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { LiveCard } from "@/components/LiveCard";
import { EmptyState } from "@/components/EmptyState";
import { AddStreamForm } from "@/components/AddStreamForm";
import { getSavedStreams, saveStream, removeStream } from "@/lib/storage";
import type { LiveStream } from "@/lib/invidious";

export default function Home() {
  const { streams, loading, error, lastChecked, refresh } = useLiveStreams();
  const [saved, setSaved] = useState<LiveStream[]>([]);

  // Load from localStorage after mount (SSR-safe)
  useEffect(() => {
    setSaved(getSavedStreams());
  }, []);

  function handleAdd(stream: LiveStream) {
    saveStream(stream);
    setSaved(getSavedStreams());
  }

  function handleRemove(videoId: string) {
    removeStream(videoId);
    setSaved(getSavedStreams());
  }

  // Merge: auto-detected live + saved, deduplicated, saved first
  const autoIds = new Set(streams.map((s) => s.videoId));
  const uniqueSaved = saved.filter((s) => !autoIds.has(s.videoId));
  const allStreams = [...streams, ...uniqueSaved];

  const isEmpty = !loading && allStreams.length === 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Platzi Live</h1>
          <p className="mt-1 text-sm text-gray-400">
            Live streams from the Platzi YouTube channel
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {/* Add stream form */}
      <div className="mb-8">
        <AddStreamForm onAdd={handleAdd} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300 ring-1 ring-red-700">
          Error: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && allStreams.length === 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-800" />
          ))}
        </div>
      )}

      {/* Stream cards */}
      {allStreams.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <LiveCard key={stream.videoId} stream={stream} />
          ))}
          {uniqueSaved.map((stream) => (
            <LiveCard
              key={stream.videoId}
              stream={stream}
              onRemove={() => handleRemove(stream.videoId)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !error && (
        <EmptyState lastChecked={lastChecked} onRefresh={refresh} />
      )}
    </main>
  );
}
