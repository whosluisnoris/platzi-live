import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const EVENT_TYPES = new Set(["play", "open_youtube", "autoplay_default"]);
// UUID anónimo generado en el navegador; nunca contiene datos personales
const SESSION_RE = /^[A-Za-z0-9-]{8,64}$/;

// POST /api/events — registra un evento de reproducción (fire-and-forget)
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { videoId, eventType, sessionId } = (body ?? {}) as Record<string, unknown>;

  if (typeof videoId !== "string" || !VIDEO_ID_RE.test(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }
  if (typeof eventType !== "string" || !EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }
  const session =
    typeof sessionId === "string" && SESSION_RE.test(sessionId) ? sessionId : null;

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    // Sin service key (p. ej. en local): la analítica se desactiva sin romper nada
    return NextResponse.json({ error: "Analytics disabled" }, { status: 503 });
  }

  const { error } = await admin.from("watch_events").insert({
    video_id: videoId,
    event_type: eventType,
    session_id: session,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
