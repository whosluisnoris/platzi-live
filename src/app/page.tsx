"use client";

import { useLiveStreams } from "@/hooks/useLiveStreams";
import { LiveCard } from "@/components/LiveCard";
import { EmptyState } from "@/components/EmptyState";

export default function Home() {
  const { streams, loading, error, lastChecked, refresh } = useLiveStreams();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
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

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300 ring-1 ring-red-700">
          Error: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && streams.length === 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-800" />
          ))}
        </div>
      )}

      {/* Stream cards */}
      {!loading && streams.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <LiveCard key={stream.videoId} stream={stream} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && streams.length === 0 && !error && (
        <EmptyState lastChecked={lastChecked} onRefresh={refresh} />
      )}
    </main>
  );
}
