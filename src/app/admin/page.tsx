"use client";

import { useState, useCallback } from "react";
import type { LiveStream } from "@/lib/invidious";
import { formatDate, timeAgo } from "@/lib/dates";
import { DailyChart } from "@/components/DailyChart";

// Paleta categórica validada (validate_palette.js, superficie #0e1013)
const EVENT_SERIES = [
  { key: "plays", label: "Reproducciones", color: "#09b06a" },
  { key: "autoplays", label: "Automáticas", color: "#4a90e0" },
  { key: "youtubeOpens", label: "YouTube", color: "#b87a16" },
];
const VISIT_SERIES = [{ key: "pageviews", label: "Vistas de página", color: "#09b06a" }];

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

interface VideoStats {
  videoId: string;
  title: string;
  plays: number;
  autoplays: number;
  youtubeOpens: number;
  uniqueSessions: number;
  lastActivity: string | null;
}

interface PollResults {
  total: number;
  counts: { si: number; puede_mejorar: number; no: number };
}

interface DailyRow {
  date: string;
  plays: number;
  autoplays: number;
  youtubeOpens: number;
  sessions: number;
  [key: string]: string | number;
}

interface VisitsState {
  configured: boolean;
  daily?: { date: string; pageviews: number; visitors: number }[];
  error?: string;
}

interface PollComment {
  answer: string;
  comment: string;
  createdAt: string;
}

const ANSWER_EMOJI: Record<string, string> = {
  si: "😍",
  puede_mejorar: "🤔",
  no: "😕",
};

const POLL_LABELS: { key: keyof PollResults["counts"]; label: string }[] = [
  { key: "si", label: "😍 Sí, me encanta" },
  { key: "puede_mejorar", label: "🤔 Puede mejorar" },
  { key: "no", label: "😕 No me convence" },
];

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
  const [stats, setStats] = useState<VideoStats[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [visits, setVisits] = useState<VisitsState | null>(null);
  const [poll, setPoll] = useState<PollResults | null>(null);
  const [comments, setComments] = useState<PollComment[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  const loadStreams = useCallback(async () => {
    const res = await fetch("/api/live");
    const data = await res.json();
    setStreams(data.streams ?? []);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { headers });
    if (!res.ok) return false;
    const data = await res.json();
    setStats(data.stats ?? []);
    setDaily(data.daily ?? []);
    setComments(data.comments ?? []);
    // encuesta y visitas de Vercel en paralelo (si fallan no bloquean nada)
    fetch("/api/feedback?question=live_platform_v1")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setPoll(p))
      .catch(() => {});
    fetch("/api/admin/visits", { headers })
      .then((r) => r.json())
      .then((v) => setVisits(v))
      .catch(() => setVisits(null));
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // La ruta de estadísticas sirve como verificación de contraseña (solo lectura)
    const ok = await loadStats();
    if (!ok) {
      setStatus({ text: "Contraseña incorrecta", ok: false });
      return;
    }
    setAuthed(true);
    setStatus(null);
    await loadStreams();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const videoId = extractVideoId(input.trim());
    if (!videoId) { setStatus({ text: "URL de YouTube o ID de video no válido", ok: false }); return; }

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

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0e1013] px-4">
        <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white">
              Platzi <span className="text-[#0aeb8b]">Admin</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">Gestiona los lives guardados</p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Contraseña de administrador"
            className="rounded-lg bg-[#14171c] px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
          />
          {status && <p className="text-sm text-red-400">{status.text}</p>}
          <button
            type="submit"
            className="rounded-lg bg-[#0aeb8b] py-2 text-sm font-semibold text-[#0e1013] hover:bg-[#08c975] transition"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Platzi <span className="text-[#0aeb8b]">Admin</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">Agrega o quita lives y revisa las estadísticas</p>
      </div>

      {/* Formulario para agregar */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pega una URL de YouTube o un ID de video…"
          className="flex-1 rounded-lg bg-[#14171c] px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-[#0aeb8b] px-5 py-2 text-sm font-semibold text-[#0e1013] hover:bg-[#08c975] disabled:opacity-50 transition"
        >
          {loading ? "Agregando…" : "Agregar"}
        </button>
      </form>

      {status && (
        <p className={`mb-4 text-sm ${status.ok ? "text-[#0aeb8b]" : "text-red-400"}`}>
          {status.text}
        </p>
      )}

      {/* Lista de videos guardados */}
      {streams.length === 0 ? (
        <p className="text-sm text-gray-400">No hay videos guardados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {streams.map((s) => (
            <li
              key={s.videoId}
              className="flex items-center justify-between rounded-lg bg-[#14171c] px-4 py-3 ring-1 ring-[#0aeb8b]/20"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{s.title}</p>
                <p className="text-xs text-gray-400">
                  {s.videoId}
                  {(s.liveStartedAt ?? s.publishedAt) && (
                    <span className="text-gray-500">
                      {" · "}{formatDate(s.liveStartedAt ?? s.publishedAt)}
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

      {/* Estadísticas */}
      <div className="mb-4 mt-14 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          Estadísticas <span className="text-[#0aeb8b]">de reproducción</span>
        </h2>
        <button
          onClick={loadStats}
          className="rounded-lg border border-[#0aeb8b]/30 px-3 py-1.5 text-xs font-medium text-[#0aeb8b] hover:bg-[#0aeb8b]/10 transition"
        >
          Actualizar
        </button>
      </div>

      {/* Gráfica de actividad diaria */}
      <div className="glass backdrop-blur-md mb-8 rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-200">
          Actividad de los últimos 14 días
        </h3>
        <DailyChart
          data={daily}
          series={EVENT_SERIES}
          tooltipExtra={(row) => `Sesiones únicas: ${Number(row.sessions ?? 0)}`}
        />
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-gray-400">
          Todavía no hay eventos registrados. Cuando alguien reproduzca un video,
          aparecerá aquí.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg ring-1 ring-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#14171c] text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Video</th>
                <th className="px-3 py-3 text-right" title="Clics para reproducir aquí">Reproducciones</th>
                <th className="px-3 py-3 text-right" title="Cargado automáticamente al entrar">Autom.</th>
                <th className="px-3 py-3 text-right" title="Aperturas en YouTube">YouTube</th>
                <th className="px-3 py-3 text-right" title="Personas únicas aproximadas">Sesiones</th>
                <th className="px-4 py-3 text-right">Última actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.map((r) => (
                <tr key={r.videoId} className="hover:bg-white/5">
                  <td className="max-w-[280px] truncate px-4 py-3 text-white" title={r.title}>
                    {r.title}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-[#0aeb8b]">{r.plays}</td>
                  <td className="px-3 py-3 text-right text-gray-300">{r.autoplays}</td>
                  <td className="px-3 py-3 text-right text-gray-300">{r.youtubeOpens}</td>
                  <td className="px-3 py-3 text-right text-gray-300">{r.uniqueSessions}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">
                    {r.lastActivity ? timeAgo(r.lastActivity) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visitas (Vercel Web Analytics) */}
      <h2 className="mb-4 mt-14 text-lg font-bold text-white">
        Visitas <span className="text-[#0aeb8b]">(Vercel Web Analytics)</span>
      </h2>
      {!visits || !visits.configured ? (
        <div className="glass backdrop-blur-md max-w-2xl rounded-2xl p-5 text-sm text-gray-300">
          <p className="mb-3">
            Vercel sí permite consultar las visitas por API, pero requiere una
            configuración única desde tu cuenta:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-gray-400">
            <li>
              En el dashboard de Vercel: proyecto <b>platzi-live</b> → pestaña{" "}
              <b>Analytics</b> → <b>Enable Web Analytics</b> (gratis en Hobby).
            </li>
            <li>
              Crea un <b>Access Token</b> en Account Settings → Tokens.
            </li>
            <li>
              Agrega en Settings → Environment Variables del proyecto:{" "}
              <code className="rounded bg-white/10 px-1">ANALYTICS_API_TOKEN</code>,{" "}
              <code className="rounded bg-white/10 px-1">ANALYTICS_PROJECT_ID</code> (prj_…) y{" "}
              <code className="rounded bg-white/10 px-1">ANALYTICS_TEAM_ID</code> (team_…).
            </li>
          </ol>
          <p className="mt-3 text-gray-500">
            Al redesplegar, esta sección mostrará la gráfica de visitas
            automáticamente. Mientras tanto, la actividad de arriba (medida por
            la propia plataforma) ya refleja las visitas con reproductor.
          </p>
        </div>
      ) : visits.error ? (
        <p className="text-sm text-red-400">
          Configurado, pero Vercel respondió con error: {visits.error}
        </p>
      ) : (
        <div className="glass backdrop-blur-md mb-8 rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-200">
            Vistas de página de los últimos 14 días
          </h3>
          <DailyChart
            data={(visits.daily ?? []) as unknown as Record<string, string | number>[]}
            series={VISIT_SERIES}
            tooltipExtra={(row) => `Visitantes únicos: ${Number(row.visitors ?? 0)}`}
          />
        </div>
      )}

      {/* Encuesta */}
      <h2 className="mb-4 mt-14 text-lg font-bold text-white">
        Encuesta <span className="text-[#0aeb8b]">de la plataforma</span>
      </h2>
      <p className="mb-3 text-sm text-gray-400">
        &ldquo;¿Te gustaría tener una funcionalidad así en Platzi?&rdquo;
      </p>
      {!poll || poll.total === 0 ? (
        <p className="text-sm text-gray-400">Todavía no hay votos.</p>
      ) : (
        <div className="flex max-w-md flex-col gap-2 rounded-lg bg-[#14171c] p-4 ring-1 ring-white/10">
          {POLL_LABELS.map(({ key, label }) => {
            const count = poll.counts[key] ?? 0;
            const pct = poll.total > 0 ? Math.round((count / poll.total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="w-40 shrink-0 text-gray-300">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[#0aeb8b]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-gray-400">
                  {count} · {pct}%
                </span>
              </div>
            );
          })}
          <p className="mt-1 text-xs text-gray-500">
            {poll.total} {poll.total === 1 ? "voto" : "votos"} en total
          </p>
        </div>
      )}

      {/* Comentarios de la encuesta */}
      <h3 className="mb-3 mt-8 text-sm font-semibold text-gray-200">
        Comentarios <span className="text-gray-500">({comments.length})</span>
      </h3>
      {comments.length === 0 ? (
        <p className="mb-8 text-sm text-gray-400">Todavía no hay comentarios.</p>
      ) : (
        <ul className="mb-8 flex max-w-2xl flex-col gap-3">
          {comments.map((c, i) => (
            <li
              key={`${c.createdAt}-${i}`}
              className="glass backdrop-blur-md rounded-xl p-4"
            >
              <p className="whitespace-pre-wrap break-words text-sm text-gray-200">
                {c.comment}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {ANSWER_EMOJI[c.answer] ?? ""} Votó &ldquo;
                {POLL_LABELS.find((l) => l.key === c.answer)?.label.replace(/^\S+ /, "") ?? c.answer}
                &rdquo; · {timeAgo(c.createdAt) ?? formatDate(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
