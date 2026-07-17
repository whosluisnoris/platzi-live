import { NextRequest, NextResponse } from "next/server";
import { fetchPlatziLiveStreams, fetchVideoDetails } from "@/lib/invidious";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import type { LiveStream } from "@/lib/invidious";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const IS_DEV = process.env.NODE_ENV !== "production";
// Máximo de páginas watch consultadas por request (detección + auto-reparación)
const MAX_ENRICH_PER_REQUEST = 3;

interface StreamRow {
  video_id: string;
  title: string;
  channel_title: string;
  published_at: string | null;
  live_started_at: string | null;
  live_ended_at: string | null;
  is_live: boolean;
  thumbnail_url: string | null;
  enriched_at: string | null;
  duration_seconds: number | null;
}

function rowToStream(row: StreamRow): LiveStream & { enrichedAt: string | null } {
  return {
    videoId: row.video_id,
    title: row.title,
    thumbnailUrl:
      row.thumbnail_url ?? `https://i.ytimg.com/vi/${row.video_id}/maxresdefault.jpg`,
    channelTitle: row.channel_title,
    watchUrl: `https://www.youtube.com/watch?v=${row.video_id}`,
    embedUrl: `https://www.youtube.com/embed/${row.video_id}?autoplay=1&rel=0`,
    publishedAt: row.published_at,
    liveStartedAt: row.live_started_at,
    liveEndedAt: row.live_ended_at,
    isLive: row.is_live,
    durationSeconds: row.duration_seconds,
    enrichedAt: row.enriched_at,
  };
}

async function fetchStoredStreams() {
  const { data, error } = await getSupabase()
    .from("streams")
    .select(
      "video_id, title, channel_title, published_at, live_started_at, live_ended_at, is_live, thumbnail_url, enriched_at, duration_seconds"
    )
    .order("live_started_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return (data as StreamRow[]).map(rowToStream);
}

// Fila lista para upsert con los metadatos scrapeados del video
async function buildEnrichedRow(stream: LiveStream) {
  const base = {
    video_id: stream.videoId,
    title: stream.title,
    channel_title: stream.channelTitle,
    is_live: true,
    thumbnail_url: `https://i.ytimg.com/vi/${stream.videoId}/maxresdefault.jpg`,
  };
  try {
    const d = await fetchVideoDetails(stream.videoId);
    return {
      ...base,
      published_at: d.publishedAt,
      live_started_at: d.liveStartedAt ?? new Date().toISOString(),
      live_ended_at: d.isLiveNow ? null : d.liveEndedAt,
      is_live: d.isLiveNow,
      duration_seconds: d.durationSeconds,
      enriched_at: new Date().toISOString(),
    };
  } catch {
    // Sin metadatos por ahora: enriched_at queda null y la auto-reparación
    // lo completará en un request posterior.
    return {
      ...base,
      live_started_at: new Date().toISOString(),
      enriched_at: null,
    };
  }
}

export async function GET(request: NextRequest) {
  // ?test=VIDEO_ID — atajo solo-dev para previsualizar la UI como si hubiera un live
  if (IS_DEV) {
    const testId = request.nextUrl.searchParams.get("test");
    if (testId) {
      if (!VIDEO_ID_RE.test(testId)) {
        return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
      }
      const mock: LiveStream = {
        videoId: testId,
        title: "[TEST] Platzi Live Stream",
        thumbnailUrl: `https://i.ytimg.com/vi/${testId}/maxresdefault.jpg`,
        channelTitle: "Platzi",
        watchUrl: `https://www.youtube.com/watch?v=${testId}`,
        embedUrl: `https://www.youtube.com/embed/${testId}?autoplay=1&rel=0`,
        publishedAt: new Date().toISOString(),
        liveStartedAt: new Date().toISOString(),
        liveEndedAt: null,
        isLive: true,
        durationSeconds: null,
      };
      const stored = await fetchStoredStreams();
      return NextResponse.json({ streams: [mock, ...stored] });
    }
  }

  // Ambas fuentes en paralelo: lives activos del canal + histórico en Supabase
  const [autoRes, storedRes] = await Promise.allSettled([
    fetchPlatziLiveStreams(),
    fetchStoredStreams(),
  ]);

  const scrapeOk = autoRes.status === "fulfilled";
  const auto = scrapeOk ? autoRes.value : [];
  const stored = storedRes.status === "fulfilled" ? storedRes.value : [];

  const liveIds = new Set(auto.map((s) => s.videoId));
  const storedIds = new Set(stored.map((s) => s.videoId));

  // Las escrituras son best-effort: sin service key (p. ej. en local) la
  // lectura sigue funcionando y solo se omite el guardado.
  let admin: SupabaseClient | null = null;
  try {
    admin = getSupabaseAdmin();
  } catch {
    admin = null;
  }

  // 1. Lives recién detectados → guardar con fechas (el live sigue visible
  //    después de terminar; los visitantes pueden ver la grabación)
  const newLive = auto.filter((s) => !storedIds.has(s.videoId));
  if (admin && newLive.length > 0) {
    const rows = await Promise.all(
      newLive.slice(0, MAX_ENRICH_PER_REQUEST).map(buildEnrichedRow)
    );
    await admin.from("streams").upsert(rows, { onConflict: "video_id" });
  }

  // 2. Transiciones de estado — solo si el scrape del canal funcionó, para no
  //    marcar lives como terminados por un fallo transitorio de red.
  if (admin && scrapeOk) {
    const nowIso = new Date().toISOString();
    const endedIds = stored
      .filter((s) => s.isLive && !liveIds.has(s.videoId))
      .map((s) => s.videoId);
    if (endedIds.length > 0) {
      await admin
        .from("streams")
        .update({ is_live: false, live_ended_at: nowIso })
        .in("video_id", endedIds);
      // Al terminar un live, la página watch ya publica su duración final
      // y el fin exacto: se capturan de una vez (best-effort).
      for (const id of endedIds.slice(0, MAX_ENRICH_PER_REQUEST)) {
        try {
          const d = await fetchVideoDetails(id);
          await admin
            .from("streams")
            .update({
              duration_seconds: d.durationSeconds,
              live_ended_at: d.liveEndedAt ?? nowIso,
              enriched_at: new Date().toISOString(),
            })
            .eq("video_id", id);
        } catch {
          // la auto-reparación lo completará después
        }
      }
    }

    const reliveIds = stored
      .filter((s) => !s.isLive && liveIds.has(s.videoId))
      .map((s) => s.videoId);
    if (reliveIds.length > 0) {
      await admin
        .from("streams")
        .update({ is_live: true, live_ended_at: null })
        .in("video_id", reliveIds);
    }
  }

  // 3. Auto-reparación: filas sin enriquecer o grabaciones sin duración
  if (admin) {
    const pending = stored
      .filter((s) => !s.enrichedAt || (s.durationSeconds == null && !s.isLive))
      .slice(0, 2);
    for (const s of pending) {
      try {
        const d = await fetchVideoDetails(s.videoId);
        await admin
          .from("streams")
          .update({
            published_at: d.publishedAt,
            live_started_at: d.liveStartedAt,
            live_ended_at: d.liveEndedAt,
            duration_seconds: d.durationSeconds,
            enriched_at: new Date().toISOString(),
          })
          .eq("video_id", s.videoId);
      } catch {
        // Se reintentará en otro request
      }
    }
  }

  // Respuesta: histórico con is_live refrescado + lives nuevos.
  // enrichedAt es interno: undefined hace que JSON lo omita.
  const streams = [
    ...newLive,
    ...stored.map((s) => ({
      ...s,
      enrichedAt: undefined,
      isLive: scrapeOk ? liveIds.has(s.videoId) : s.isLive,
    })),
  ];

  return NextResponse.json({ streams });
}
