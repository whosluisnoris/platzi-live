import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchVideoDetails } from "@/lib/invidious";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// POST /api/admin/streams — add a stream
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { videoId, title, channelTitle } = body;

  if (!videoId || !VIDEO_ID_RE.test(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  const base = {
    video_id: videoId,
    title: title ?? "Platzi Live",
    channel_title: channelTitle ?? "Platzi",
    thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  };

  // Con fechas y estado reales el video queda bien ubicado de inmediato: si
  // está en vivo pasa a "En vivo ahora" (y al reproductor principal), y si es
  // una grabación se ordena por su fecha real en vez de caer al fondo.
  let row;
  try {
    const d = await fetchVideoDetails(videoId);
    row = {
      ...base,
      published_at: d.publishedAt,
      live_started_at: d.liveStartedAt ?? new Date().toISOString(),
      live_ended_at: d.isLiveNow ? null : d.liveEndedAt,
      is_live: d.isLiveNow,
      duration_seconds: d.durationSeconds,
      enriched_at: new Date().toISOString(),
    };
  } catch {
    // Sin metadatos por ahora: con la fecha de alta no cae al fondo, y la
    // auto-reparación de /api/live completará el resto (incluido is_live).
    row = { ...base, live_started_at: new Date().toISOString(), enriched_at: null };
  }

  const { error } = await getSupabaseAdmin()
    .from("streams")
    .upsert(row, { onConflict: "video_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/streams — remove a stream by videoId
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await request.json();
  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("streams")
    .delete()
    .eq("video_id", videoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
