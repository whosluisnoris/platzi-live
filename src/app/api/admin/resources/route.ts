import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { fetchOEmbed } from "@/lib/oembed";
import { fetchVideoDetails, fetchPlaylistVideos } from "@/lib/invidious";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanCategoryIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((x): x is string => typeof x === "string" && UUID_RE.test(x));
}

// Reemplaza el conjunto de categorías de un recurso por el nuevo.
async function setCategories(
  admin: SupabaseClient,
  resourceId: string,
  categoryIds: string[]
) {
  await admin.from("resource_categories").delete().eq("resource_id", resourceId);
  if (categoryIds.length > 0) {
    await admin
      .from("resource_categories")
      .insert(categoryIds.map((category_id) => ({ resource_id: resourceId, category_id })));
  }
}

// GET /api/admin/resources — recursos con sus categorías (para la tabla del admin)
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from("resources")
    .select("*, resource_categories(category_id)")
    .order("added_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ resources: data ?? [] });
}

// POST /api/admin/resources — alta de un recurso (video suelto o playlist)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const url = typeof body.url === "string" ? body.url : "";
  const target = parseYouTubeUrl(url);
  if (!target) {
    return NextResponse.json(
      { error: "URL de YouTube no reconocida (video o playlist)" },
      { status: 400 }
    );
  }
  const categoryIds = cleanCategoryIds(body.categoryIds);
  const manualTitle =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

  const admin = getSupabaseAdmin();

  if (target.kind === "video") {
    return addVideo(admin, target.id, categoryIds, manualTitle);
  }
  return addPlaylist(admin, target.id, categoryIds, manualTitle);
}

async function addVideo(
  admin: SupabaseClient,
  videoId: string,
  categoryIds: string[],
  manualTitle: string | null
) {
  const oembed = await fetchOEmbed(videoId);
  let publishedAt: string | null = null;
  let durationSeconds: number | null = null;
  try {
    const d = await fetchVideoDetails(videoId);
    publishedAt = d.publishedAt;
    durationSeconds = d.durationSeconds;
  } catch {
    // sin metadatos por ahora; el título/canal de oEmbed basta para crearlo
  }

  const { data, error } = await admin
    .from("resources")
    .insert({
      kind: "video",
      youtube_id: videoId,
      title: manualTitle ?? oembed.title ?? "Video",
      channel_title: oembed.channelTitle,
      thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration_seconds: durationSeconds,
      published_at: publishedAt,
      source: "manual",
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return insertError(error);
  await setCategories(admin, data.id, categoryIds);
  return NextResponse.json({ ok: true, resourceId: data.id, kind: "video" });
}

async function addPlaylist(
  admin: SupabaseClient,
  playlistId: string,
  categoryIds: string[],
  manualTitle: string | null
) {
  let imported;
  try {
    imported = await fetchPlaylistVideos(playlistId);
  } catch {
    imported = null;
  }

  // Si el scrape falló por completo, se puede crear igual con un título manual
  // y luego agregar episodios a mano (fallback). Sin título no hay cómo nombrarla.
  if (!imported && !manualTitle) {
    return NextResponse.json(
      {
        error:
          "No se pudo leer la playlist de YouTube. Vuelve a intentar, o crea la playlist escribiendo un título y agrega los videos manualmente.",
        needsTitle: true,
      },
      { status: 502 }
    );
  }

  const items = imported?.items ?? [];
  const thumbnailUrl =
    items[0]?.thumbnailUrl ??
    `https://i.ytimg.com/vi/${items[0]?.videoId ?? ""}/maxresdefault.jpg`;

  const { data, error } = await admin
    .from("resources")
    .insert({
      kind: "playlist",
      youtube_id: playlistId,
      title: manualTitle ?? imported?.title ?? "Playlist",
      channel_title: imported?.channelTitle ?? null,
      thumbnail_url: items.length > 0 ? thumbnailUrl : null,
      video_count: items.length,
      source: imported ? "playlist_import" : "manual",
      synced_at: imported ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) return insertError(error);

  if (items.length > 0) {
    await admin.from("playlist_items").insert(
      items.map((it) => ({
        playlist_resource_id: data.id,
        position: it.position,
        youtube_video_id: it.videoId,
        title: it.title,
        thumbnail_url: it.thumbnailUrl,
      }))
    );
  }
  await setCategories(admin, data.id, categoryIds);

  return NextResponse.json({
    ok: true,
    resourceId: data.id,
    kind: "playlist",
    imported: items.length,
    // Aviso al admin: playlist larga cortada en la primera página, o scrape fallido
    warning: !imported
      ? "La playlist se creó vacía; agrega los videos manualmente."
      : imported.hasMore
        ? `Se importaron ${items.length} videos (primera página). Agrega el resto manualmente.`
        : undefined,
  });
}

function insertError(error: { code?: string; message: string }) {
  const conflict = error.code === "23505";
  return NextResponse.json(
    { error: conflict ? "Ese recurso ya existe en el catálogo" : error.message },
    { status: conflict ? 409 : 500 }
  );
}

// PATCH /api/admin/resources — reasignar categorías y/o editar título/descripción
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.description === "string")
    updates.description = body.description.trim() || null;
  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from("resources").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(body.categoryIds)) {
    await setCategories(admin, id, cleanCategoryIds(body.categoryIds));
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/resources — borra un recurso (items y categorías caen por cascade)
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("resources").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
