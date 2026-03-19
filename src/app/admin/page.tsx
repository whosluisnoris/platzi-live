"use client";

import { useState, useEffect, useCallback } from "react";
import type { LiveStream } from "@/lib/invidious";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v");
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
  } catch { /* not a URL */ }
  const clean = input.trim();
  return VIDEO_ID_RE.test(clean) ? clean : null;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  const loadStreams = useCallback(async () => {
    const res = await fetch("/api/live");
    const data = await res.json();
    setStreams(data.streams ?? []);
  }, []);

  useEffect(() => {
    if (authed) loadStreams();
  }, [authed, loadStreams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Verify the secret works by attempting a no-op request
    const res = await fetch("/api/admin/streams", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ videoId: "________no-op" }),
    });
    if (res.status === 401) {
      setStatus("Wrong password");
    } else {
      setAuthed(true);
      setStatus(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const videoId = extractVideoId(input.trim());
    if (!videoId) { setStatus("Invalid YouTube URL or video ID"); return; }

    setLoading(true);
    setStatus(null);

    // Resolve title via oEmbed
    const oEmbed = await fetch(`/api/oembed?videoId=${videoId}`).then((r) => r.json()).catch(() => ({}));

    const res = await fetch("/api/admin/streams", {
      method: "POST",
      headers,
      body: JSON.stringify({
        videoId,
        title: oEmbed.title ?? "Platzi Live",
        channelTitle: oEmbed.channelTitle ?? "Platzi",
      }),
    });

    if (res.ok) {
      setInput("");
      setStatus("Stream added ✓");
      await loadStreams();
    } else {
      const data = await res.json();
      setStatus(data.error ?? "Failed to add stream");
    }
    setLoading(false);
  }

  async function handleRemove(videoId: string) {
    await fetch("/api/admin/streams", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ videoId }),
    });
    await loadStreams();
    setStatus("Stream removed");
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin password"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-white/30"
          />
          {status && <p className="text-sm text-red-400">{status}</p>}
          <button
            type="submit"
            className="rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-white">Admin — Manage Streams</h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mb-8 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YouTube URL or video ID…"
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-white/30"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </form>

      {status && <p className="mb-4 text-sm text-green-400">{status}</p>}

      {/* Stream list */}
      {streams.length === 0 ? (
        <p className="text-sm text-gray-400">No streams saved.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {streams.map((s) => (
            <li
              key={s.videoId}
              className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 ring-1 ring-white/10"
            >
              <div>
                <p className="text-sm font-medium text-white">{s.title}</p>
                <p className="text-xs text-gray-400">{s.videoId}</p>
              </div>
              <button
                onClick={() => handleRemove(s.videoId)}
                className="ml-4 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
