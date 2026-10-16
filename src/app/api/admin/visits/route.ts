import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// GET /api/admin/visits — visitas desde la Web Analytics API de Vercel.
// Requiere configurar en Vercel (ver docs/04-analitica.md):
//   ANALYTICS_API_TOKEN   — Access Token de Vercel
//   ANALYTICS_PROJECT_ID  — id del proyecto (prj_...)
//   ANALYTICS_TEAM_ID     — id del team (team_...), opcional en cuentas personales
// Sin configurar responde { configured: false } y el panel muestra la guía.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.ANALYTICS_API_TOKEN;
  const projectId = process.env.ANALYTICS_PROJECT_ID;
  const teamId = process.env.ANALYTICS_TEAM_ID;

  if (!token || !projectId) {
    return NextResponse.json({ configured: false });
  }

  const until = new Date();
  const since = new Date(Date.now() - 13 * 86_400_000);
  const params = new URLSearchParams({
    projectId,
    by: "day",
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  });
  if (teamId) params.set("teamId", teamId);

  try {
    const res = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, error: `Vercel API ${res.status}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      data?: { timestamp: string; pageviews?: number; visitors?: number }[];
    };
    const daily = (data.data ?? []).map((r) => ({
      date: String(r.timestamp).slice(0, 10),
      pageviews: r.pageviews ?? 0,
      visitors: r.visitors ?? 0,
    }));
    return NextResponse.json({ configured: true, daily });
  } catch {
    return NextResponse.json(
      { configured: true, error: "No se pudo consultar Vercel" },
      { status: 502 }
    );
  }
}
