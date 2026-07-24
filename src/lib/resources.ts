import type { SupabaseClient } from "@supabase/supabase-js";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { fetchOEmbed } from "@/lib/oembed";
import { fetchVideoDetails, fetchPlaylistVideos } from "@/lib/invidious";

// Alta de un recurso (video suelto o playlist) a partir de una URL de YouTube.
// Compartido por el alta del admin y por los envíos de la comunidad. La única
// diferencia es `submittedBy`: null para lo curado por el admin, el id del
// usuario para lo que aporta la comunidad. El status arranca en 'published'.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cleanCategoryIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((x): x is string => typeof x === "string" && UUID_RE.test(x));
}

// Reemplaza el conjunto de categorías de un recurso por el nuevo.
export async function setCategories(
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

export type CreateResourceResult =
  | {
      ok: true;
      resourceId: string;
      kind: "video" | "playlist";
      imported?: number;
      warning?: string;
    }
  | { ok: false; status: number; error: string; needsTitle?: boolean };

export async function createResourceFromUrl(
  admin: SupabaseClient,
  opts: {
    url: string;
    categoryIds: string[];
    manualTitle?: string | null;
    submittedBy?: string | null;
  }
): Promise<CreateResourceResult> {
  const target = parseYouTubeUrl(opts.url);
  if (!target) {
    return {
      ok: false,
      status: 400,
      error: "URL de YouTube no reconocida (video o playlist).",
    };
  }

  const shared = {
    categoryIds: opts.categoryIds,
    manualTitle: opts.manualTitle ?? null,
    submittedBy: opts.submittedBy ?? null,
  };

  return target.kind === "video"
    ? addVideo(admin, target.id, shared)
    : addPlaylist(admin, target.id, shared);
}

interface AddOpts {
  categoryIds: string[];
  manualTitle: string | null;
  submittedBy: string | null;
}

async function addVideo(
  admin: SupabaseClient,
  videoId: string,
  { categoryIds, manualTitle, submittedBy }: AddOpts
): Promise<CreateResourceResult> {
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
      submitted_by: submittedBy,
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return insertError(error);
  await setCategories(admin, data.id, categoryIds);
  return { ok: true, resourceId: data.id, kind: "video" };
}

async function addPlaylist(
  admin: SupabaseClient,
  playlistId: string,
  { categoryIds, manualTitle, submittedBy }: AddOpts
): Promise<CreateResourceResult> {
  let imported;
  try {
    imported = await fetchPlaylistVideos(playlistId);
  } catch {
    imported = null;
  }

  if (!imported && !manualTitle) {
    return {
      ok: false,
      status: 502,
      error:
        "No se pudo leer la playlist de YouTube. Vuelve a intentar, o pega el link de un video.",
      needsTitle: true,
    };
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
      submitted_by: submittedBy,
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

  return {
    ok: true,
    resourceId: data.id,
    kind: "playlist",
    imported: items.length,
    warning: !imported
      ? "La playlist se creó vacía; agrega los videos manualmente."
      : imported.hasMore
        ? `Se importaron ${items.length} videos (primera página). Agrega el resto manualmente.`
        : undefined,
  };
}

function insertError(error: { code?: string; message: string }): CreateResourceResult {
  const conflict = error.code === "23505";
  return {
    ok: false,
    status: conflict ? 409 : 500,
    error: conflict ? "Ese video ya está en Clusly." : error.message,
  };
}
