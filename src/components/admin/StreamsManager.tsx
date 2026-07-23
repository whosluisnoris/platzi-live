"use client";

import { useState, useCallback, useEffect } from "react";
import type { LiveStream } from "@/lib/invidious";
import { formatDate } from "@/lib/dates";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v");
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
  } catch {
    /* not a URL */
  }
  const clean = input.trim();
  return VIDEO_ID_RE.test(clean) ? clean : null;
}

// Gestión de los lives de Platzi (extraída tal cual del panel original): agregar
// pegando URL/ID de YouTube y quitar. La detección automática sigue en /api/live.
export function StreamsManager({ secret }: { secret: string }) {
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
    // El setState ocurre tras await dentro de loadStreams (no es síncrono).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStreams();
  }, [loadStreams]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const videoId = extractVideoId(input.trim());
    if (!videoId) {
      setStatus({ text: "URL de YouTube o ID de video no válido", ok: false });
      return;
    }

    setLoading(true);
    setStatus(null);

    const oEmbed = await fetch(`/api/oembed?videoId=${videoId}`)
      .then((r) => r.json())
      .catch(() => ({}));

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
      setStatus({ text: "Video agregado ✓", ok: true });
      await loadStreams();
    } else {
      const data = await res.json();
      setStatus({ text: data.error ?? "No se pudo agregar el video", ok: false });
    }
    setLoading(false);
  }

  async function handleRemove(videoId: string) {
    const confirmed = window.confirm(
      "¿Seguro que quieres quitar este video de la plataforma? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;
    await fetch("/api/admin/streams", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ videoId }),
    });
    await loadStreams();
    setStatus({ text: "Video eliminado", ok: true });
  }

  return (
    <section>
      <p className="mb-6 text-sm text-muted">
        Los lives se detectan y guardan automáticamente. Aquí puedes agregar uno a
        mano o quitar los que no quieras mostrar.
      </p>

      {/* Formulario para agregar */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pega una URL de YouTube o un ID de video…"
          className="flex-1 rounded-lg bg-surface px-4 py-2 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-accent/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Agregando…" : "Agregar"}
        </button>
      </form>

      {status && (
        <p className={`mb-4 text-sm ${status.ok ? "text-accent-ink" : "text-red-400"}`}>
          {status.text}
        </p>
      )}

      {/* Lista de videos guardados */}
      {streams.length === 0 ? (
        <p className="text-sm text-muted">No hay videos guardados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {streams.map((s) => (
            <li
              key={s.videoId}
              className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 ring-1 ring-accent/20"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted">
                  {s.videoId}
                  {s.liveStartedAt && (
                    <span className="text-faint">
                      {" · "}
                      {formatDate(s.liveStartedAt)}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleRemove(s.videoId)}
                className="ml-4 shrink-0 rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
