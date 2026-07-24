import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeAdmin } from "@/lib/admin-auth";
import { fetchPlaylistVideos } from "@/lib/invidious";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/admin/resources/[id]/sync — re-scrapea la playlist y hace upsert de
// sus videos. Nunca borra items existentes (principio "nunca destructivo"):
// inserta los nuevos y refresca posición/título/miniatura de los que ya estaban.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const admin = getSupabaseAdmin();
  const { data: resource } = await admin
    .from("resources")
    .select("id, kind, youtube_id, title, channel_title, thumbnail_url")
    .eq("id", id)
    .maybeSingle();
  if (!resource || resource.kind !== "playlist") {
    return NextResponse.json({ error: "Playlist no encontrada" }, { status: 404 });
  }

  let imported;
  try {
    imported = await fetchPlaylistVideos(resource.youtube_id);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la playlist de YouTube ahora mismo" },
      { status: 502 }
    );
  }

  if (imported.items.length > 0) {
    await admin.from("playlist_items").upsert(
      imported.items.map((it) => ({
        playlist_resource_id: id,
        position: it.position,
        youtube_video_id: it.videoId,
        title: it.title,
        thumbnail_url: it.thumbnailUrl,
      })),
      { onConflict: "playlist_resource_id,youtube_video_id" }
    );
  }

  // Recuento real tras el upsert
  const { count } = await admin
    .from("playlist_items")
    .select("id", { count: "exact", head: true })
    .eq("playlist_resource_id", id);

  // Solo rellena metadatos vacíos; no pisa lo que el admin haya editado a mano.
  const updates: Record<string, unknown> = {
    video_count: count ?? 0,
    synced_at: new Date().toISOString(),
    source: "playlist_import",
  };
  if (!resource.title || resource.title === "Playlist") {
    if (imported.title) updates.title = imported.title;
  }
  if (!resource.channel_title && imported.channelTitle)
    updates.channel_title = imported.channelTitle;
  if (!resource.thumbnail_url && imported.items[0])
    updates.thumbnail_url = imported.items[0].thumbnailUrl;

  await admin.from("resources").update(updates).eq("id", id);

  return NextResponse.json({
    ok: true,
    imported: imported.items.length,
    total: count ?? 0,
    hasMore: imported.hasMore,
  });
}
