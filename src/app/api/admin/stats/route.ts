import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { LOFI_STREAM } from "@/lib/constants";
import { authorizeAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface StatsRow {
  video_id: string;
  plays: number;
  autoplays: number;
  youtube_opens: number;
  unique_sessions: number;
  last_activity: string | null;
}

// Serie diaria para la gráfica del panel
const DAYS_WINDOW = 14;
const TZ = "America/Mexico_City";

function dayKey(iso: string): string {
  // "sv-SE" produce YYYY-MM-DD, estable para agrupar por día en la TZ dada
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
}

interface EventRow {
  event_type: string;
  session_id: string | null;
  created_at: string;
}

function buildDaily(events: EventRow[]) {
  const days: string[] = [];
  for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
    days.push(dayKey(new Date(Date.now() - i * 86_400_000).toISOString()));
  }
  const byDay = new Map(
    days.map((d) => [
      d,
      { plays: 0, autoplays: 0, youtubeOpens: 0, sessions: new Set<string>() },
    ])
  );
  for (const e of events) {
    const bucket = byDay.get(dayKey(e.created_at));
    if (!bucket) continue;
    if (e.event_type === "play") bucket.plays += 1;
    else if (e.event_type === "autoplay_default") bucket.autoplays += 1;
    else if (e.event_type === "open_youtube") bucket.youtubeOpens += 1;
    if (e.session_id) bucket.sessions.add(e.session_id);
  }
  return days.map((d) => {
    const b = byDay.get(d)!;
    return {
      date: d,
      plays: b.plays,
      autoplays: b.autoplays,
      youtubeOpens: b.youtubeOpens,
      sessions: b.sessions.size,
    };
  });
}

// GET /api/admin/stats — agregados de reproducción por video
export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const sinceIso = new Date(
    Date.now() - DAYS_WINDOW * 86_400_000
  ).toISOString();
  const [statsRes, titlesRes, eventsRes, commentsRes] = await Promise.all([
    admin
      .from("watch_stats")
      .select("*")
      .order("last_activity", { ascending: false }),
    admin.from("streams").select("video_id, title"),
    admin
      .from("watch_events")
      .select("event_type, session_id, created_at")
      .gte("created_at", sinceIso)
      .limit(20_000),
    admin
      .from("feedback_votes")
      .select("answer, comment, created_at")
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (statsRes.error) {
    return NextResponse.json({ error: statsRes.error.message }, { status: 500 });
  }

  const titles = new Map(
    ((titlesRes.data ?? []) as { video_id: string; title: string }[]).map((r) => [
      r.video_id,
      r.title,
    ])
  );
  titles.set(LOFI_STREAM.videoId, LOFI_STREAM.title);

  const stats = ((statsRes.data ?? []) as StatsRow[]).map((r) => ({
    videoId: r.video_id,
    title: titles.get(r.video_id) ?? r.video_id,
    plays: r.plays,
    autoplays: r.autoplays,
    youtubeOpens: r.youtube_opens,
    uniqueSessions: r.unique_sessions,
    lastActivity: r.last_activity,
  }));

  const daily = buildDaily((eventsRes.data ?? []) as EventRow[]);

  const comments = (
    (commentsRes.data ?? []) as {
      answer: string;
      comment: string;
      created_at: string;
    }[]
  ).map((c) => ({
    answer: c.answer,
    comment: c.comment,
    createdAt: c.created_at,
  }));

  return NextResponse.json({ stats, daily, comments });
}
