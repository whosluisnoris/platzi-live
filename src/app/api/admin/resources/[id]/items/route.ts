import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeAdmin } from "@/lib/admin-auth";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { fetchOEmbed } from "@/lib/oembed";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Recalcula video_count = nº real de items de la playlist.
async function refreshCount(admin: SupabaseClient, playlistId: string) {
  const { count } = await admin
    .from("playlist_items")
    .select("id", { count: "exact", head: true })
    .eq("playlist_resource_id", playlistId);
  await admin
    .from("resources")
    .update({ video_count: count ?? 0 })
    .eq("id", playlistId);
}

// GET /api/admin/resources/[id]/items — lista los videos de la playlist (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("playlist_items")
    .select("id, playlist_resource_id, position, youtube_video_id, title, thumbnail_url")
    .eq("playlist_resource_id", id)
    .order("position", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/admin/resources/[id]/items — agrega un video suelto a la playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const target = parseYouTubeUrl(typeof body.url === "string" ? body.url : "");
  if (!target || target.kind !== "video") {
    return NextResponse.json(
      { error: "Pega la URL o el ID de un video de YouTube" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // La playlist debe existir y ser de tipo playlist
  const { data: playlist } = await admin
    .from("resources")
    .select("id, kind")
    .eq("id", id)
    .maybeSingle();
  if (!playlist || playlist.kind !== "playlist") {
    return NextResponse.json({ error: "Playlist no encontrada" }, { status: 404 });
  }

  const oembed = await fetchOEmbed(target.id);

  // Posición = al final (máxima actual + 1)
  const { data: last } = await admin
    .from("playlist_items")
    .select("position")
    .eq("playlist_resource_id", id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? 0) + 1;

  const { error } = await admin.from("playlist_items").insert({
    playlist_resource_id: id,
    position,
    youtube_video_id: target.id,
    title: oembed.title ?? "Video",
    thumbnail_url: `https://i.ytimg.com/vi/${target.id}/maxresdefault.jpg`,
  });

  if (error) {
    const conflict = error.code === "23505";
    return NextResponse.json(
      { error: conflict ? "Ese video ya está en la playlist" : error.message },
      { status: conflict ? 409 : 500 }
    );
  }

  await refreshCount(admin, id);
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/resources/[id]/items — quita un video de la playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const youtubeVideoId =
    typeof body.youtubeVideoId === "string" ? body.youtubeVideoId : "";
  if (!youtubeVideoId) {
    return NextResponse.json({ error: "Falta youtubeVideoId" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("playlist_items")
    .delete()
    .eq("playlist_resource_id", id)
    .eq("youtube_video_id", youtubeVideoId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshCount(admin, id);
  return NextResponse.json({ ok: true });
}
