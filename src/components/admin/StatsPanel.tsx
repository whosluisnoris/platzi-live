"use client";

import { useState, useCallback, useEffect } from "react";
import { timeAgo } from "@/lib/dates";
import { DailyChart } from "@/components/DailyChart";
import { Alert, Button, Card, EmptyState, SectionHeader } from "@/components/ui";

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

// Panel de estadísticas: reproducciones,
// visitas de Vercel.
export function StatsPanel() {
  const [stats, setStats] = useState<VideoStats[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [visits, setVisits] = useState<VisitsState | null>(null);

  const headers = { "Content-Type": "application/json" };

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { headers });
    if (!res.ok) return;
    const data = await res.json();
    setStats(data.stats ?? []);
    setDaily(data.daily ?? []);
    fetch("/api/admin/visits", { headers })
      .then((r) => r.json())
      .then((v) => setVisits(v))
      .catch(() => setVisits(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <section className="flex flex-col">
      <SectionHeader
        title="Estadísticas de reproducción"
        action={
          <Button variant="secondary" size="sm" onClick={loadStats}>
            Actualizar
          </Button>
        }
      />

      {/* Gráfica de actividad diaria */}
      <Card className="mb-6">
        <SectionHeader size="sm" as="h3" title="Actividad de los últimos 14 días" />
        <DailyChart
          data={daily}
          series={EVENT_SERIES}
          tooltipExtra={(row) => `Sesiones únicas: ${Number(row.sessions ?? 0)}`}
        />
      </Card>

      {stats.length === 0 ? (
        <EmptyState description="Todavía no hay eventos registrados. Cuando alguien reproduzca un video, aparecerá aquí." />
      ) : (
        <div className="custom-scroll overflow-x-auto rounded-2xl bg-surface ring-1 ring-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase tracking-wide text-muted">
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
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-accent-ink">{r.plays}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{r.autoplays}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{r.youtubeOpens}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{r.uniqueSessions}</td>
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
      <SectionHeader className="mt-14" title="Visitas (Vercel Web Analytics)" />
      {!visits || !visits.configured ? (
        <Card className="max-w-2xl text-sm leading-relaxed text-muted">
          <p className="mb-3">
            Vercel sí permite consultar las visitas por API, pero requiere una
            configuración única desde tu cuenta:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>
              En el dashboard de Vercel: tu proyecto → pestaña{" "}
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
        </Card>
      ) : visits.error ? (
        <Alert tone="error">Configurado, pero Vercel respondió con error: {visits.error}</Alert>
      ) : (
        <Card>
          <SectionHeader size="sm" as="h3" title="Vistas de página de los últimos 14 días" />
          <DailyChart
            data={(visits.daily ?? []) as unknown as Record<string, string | number>[]}
            series={VISIT_SERIES}
            tooltipExtra={(row) => `Visitantes únicos: ${Number(row.visitors ?? 0)}`}
          />
        </Card>
      )}
    </section>
  );
}
