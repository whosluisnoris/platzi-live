"use client";

import { useState, useCallback, useEffect } from "react";
import { formatDate, timeAgo } from "@/lib/dates";
import { DailyChart } from "@/components/DailyChart";

// Paleta categórica validada (validate_palette.js, superficie #0e1013)
const EVENT_SERIES = [
  { key: "plays", label: "Reproducciones", color: "#09b06a" },
  { key: "autoplays", label: "Automáticas", color: "#4a90e0" },
  { key: "youtubeOpens", label: "YouTube", color: "#b87a16" },
];
const VISIT_SERIES = [{ key: "pageviews", label: "Vistas de página", color: "#09b06a" }];

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

// Panel de estadísticas (extraído tal cual del admin original): reproducciones,
// visitas de Vercel, encuesta y comentarios.
export function StatsPanel({ secret }: { secret: string }) {
  const [stats, setStats] = useState<VideoStats[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [visits, setVisits] = useState<VisitsState | null>(null);
  const [poll, setPoll] = useState<PollResults | null>(null);
  const [comments, setComments] = useState<PollComment[]>([]);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { headers });
    if (!res.ok) return;
    const data = await res.json();
    setStats(data.stats ?? []);
    setDaily(data.daily ?? []);
    setComments(data.comments ?? []);
    fetch("/api/feedback?question=live_platform_v1")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setPoll(p))
      .catch(() => {});
    fetch("/api/admin/visits", { headers })
      .then((r) => r.json())
      .then((v) => setVisits(v))
      .catch(() => setVisits(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Estadísticas <span className="text-accent">de reproducción</span>
        </h2>
        <button
          onClick={loadStats}
          className="rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition"
        >
          Actualizar
        </button>
      </div>

      {/* Gráfica de actividad diaria */}
      <div className="glass backdrop-blur-md mb-8 rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Actividad de los últimos 14 días
        </h3>
        <DailyChart
          data={daily}
          series={EVENT_SERIES}
          tooltipExtra={(row) => `Sesiones únicas: ${Number(row.sessions ?? 0)}`}
        />
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-muted">
          Todavía no hay eventos registrados. Cuando alguien reproduzca un video,
          aparecerá aquí.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg ring-1 ring-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Video</th>
                <th className="px-3 py-3 text-right" title="Clics para reproducir aquí">Reproducciones</th>
                <th className="px-3 py-3 text-right" title="Cargado automáticamente al entrar">Autom.</th>
                <th className="px-3 py-3 text-right" title="Aperturas en YouTube">YouTube</th>
                <th className="px-3 py-3 text-right" title="Personas únicas aproximadas">Sesiones</th>
                <th className="px-4 py-3 text-right">Última actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map((r) => (
                <tr key={r.videoId} className="hover:bg-fill">
                  <td className="max-w-[280px] truncate px-4 py-3 text-foreground" title={r.title}>
                    {r.title}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-accent">{r.plays}</td>
                  <td className="px-3 py-3 text-right text-muted">{r.autoplays}</td>
                  <td className="px-3 py-3 text-right text-muted">{r.youtubeOpens}</td>
                  <td className="px-3 py-3 text-right text-muted">{r.uniqueSessions}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted">
                    {r.lastActivity ? timeAgo(r.lastActivity) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visitas (Vercel Web Analytics) */}
      <h2 className="mb-4 mt-14 text-lg font-bold text-foreground">
        Visitas <span className="text-accent">(Vercel Web Analytics)</span>
      </h2>
      {!visits || !visits.configured ? (
        <div className="glass backdrop-blur-md max-w-2xl rounded-2xl p-5 text-sm text-muted">
          <p className="mb-3">
            Vercel sí permite consultar las visitas por API, pero requiere una
            configuración única desde tu cuenta:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>
              En el dashboard de Vercel: proyecto <b>platzi-live</b> → pestaña{" "}
              <b>Analytics</b> → <b>Enable Web Analytics</b> (gratis en Hobby).
            </li>
            <li>
              Crea un <b>Access Token</b> en Account Settings → Tokens.
            </li>
            <li>
              Agrega en Settings → Environment Variables del proyecto:{" "}
              <code className="rounded bg-fill-strong px-1">ANALYTICS_API_TOKEN</code>,{" "}
              <code className="rounded bg-fill-strong px-1">ANALYTICS_PROJECT_ID</code> (prj_…) y{" "}
              <code className="rounded bg-fill-strong px-1">ANALYTICS_TEAM_ID</code> (team_…).
            </li>
          </ol>
          <p className="mt-3 text-faint">
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
          <h3 className="mb-4 text-sm font-semibold text-foreground">
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
      <h2 className="mb-4 mt-14 text-lg font-bold text-foreground">
        Encuesta <span className="text-accent">de la plataforma</span>
      </h2>
      <p className="mb-3 text-sm text-muted">
        &ldquo;¿Te gustaría tener una funcionalidad así en Platzi?&rdquo;
      </p>
      {!poll || poll.total === 0 ? (
        <p className="text-sm text-muted">Todavía no hay votos.</p>
      ) : (
        <div className="flex max-w-md flex-col gap-2 rounded-lg bg-surface p-4 ring-1 ring-border">
          {POLL_LABELS.map(({ key, label }) => {
            const count = poll.counts[key] ?? 0;
            const pct = poll.total > 0 ? Math.round((count / poll.total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="w-40 shrink-0 text-muted">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-muted">
                  {count} · {pct}%
                </span>
              </div>
            );
          })}
          <p className="mt-1 text-xs text-faint">
            {poll.total} {poll.total === 1 ? "voto" : "votos"} en total
          </p>
        </div>
      )}

      {/* Comentarios de la encuesta */}
      <h3 className="mb-3 mt-8 text-sm font-semibold text-foreground">
        Comentarios <span className="text-faint">({comments.length})</span>
      </h3>
      {comments.length === 0 ? (
        <p className="mb-8 text-sm text-muted">Todavía no hay comentarios.</p>
      ) : (
        <ul className="mb-8 flex max-w-2xl flex-col gap-3">
          {comments.map((c, i) => (
            <li key={`${c.createdAt}-${i}`} className="glass backdrop-blur-md rounded-xl p-4">
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {c.comment}
              </p>
              <p className="mt-2 text-xs text-faint">
                {ANSWER_EMOJI[c.answer] ?? ""} Votó &ldquo;
                {POLL_LABELS.find((l) => l.key === c.answer)?.label.replace(/^\S+ /, "") ?? c.answer}
                &rdquo; · {timeAgo(c.createdAt) ?? formatDate(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
