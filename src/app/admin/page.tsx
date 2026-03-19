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
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
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
    const res = await fetch("/api/admin/streams", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ videoId: "________no-op" }),
    });
    if (res.status === 401) {
      setStatus({ text: "Wrong password", ok: false });
    } else {
      setAuthed(true);
      setStatus(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const videoId = extractVideoId(input.trim());
    if (!videoId) { setStatus({ text: "Invalid YouTube URL or video ID", ok: false }); return; }

    setLoading(true);
    setStatus(null);

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
      setStatus({ text: "Stream added ✓", ok: true });
      await loadStreams();
    } else {
      const data = await res.json();
      setStatus({ text: data.error ?? "Failed to add stream", ok: false });
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
    setStatus({ text: "Stream removed", ok: true });
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
        <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white">
              Platzi <span className="text-[#98ca3f]">Admin</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">Manage live stream links</p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin password"
            className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#98ca3f]/50"
          />
          {status && <p className="text-sm text-red-400">{status.text}</p>}
          <button
            type="submit"
            className="rounded-lg bg-[#98ca3f] py-2 text-sm font-semibold text-[#0d0d0d] hover:bg-[#aad44f] transition"
          >
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Platzi <span className="text-[#98ca3f]">Admin</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">Add or remove live stream links</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste YouTube URL or video ID…"
          className="flex-1 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#98ca3f]/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-[#98ca3f] px-5 py-2 text-sm font-semibold text-[#0d0d0d] hover:bg-[#aad44f] disabled:opacity-50 transition"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </form>

      {status && (
        <p className={`mb-4 text-sm ${status.ok ? "text-[#98ca3f]" : "text-red-400"}`}>
          {status.text}
        </p>
      )}

      {/* Stream list */}
      {streams.length === 0 ? (
        <p className="text-sm text-gray-400">No streams saved.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {streams.map((s) => (
            <li
              key={s.videoId}
              className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-4 py-3 ring-1 ring-[#98ca3f]/20"
            >
              <div>
                <p className="text-sm font-medium text-white">{s.title}</p>
                <p className="text-xs text-gray-400">{s.videoId}</p>
              </div>
              <button
                onClick={() => handleRemove(s.videoId)}
                className="ml-4 rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition"
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
