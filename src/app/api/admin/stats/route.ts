import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { LOFI_STREAM } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

interface StatsRow {
  video_id: string;
  plays: number;
  autoplays: number;
  youtube_opens: number;
  unique_sessions: number;
  last_activity: string | null;
}

// GET /api/admin/stats — agregados de reproducción por video
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const [statsRes, titlesRes] = await Promise.all([
    admin
      .from("watch_stats")
      .select("*")
      .order("last_activity", { ascending: false }),
    admin.from("streams").select("video_id, title"),
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

  return NextResponse.json({ stats });
}
