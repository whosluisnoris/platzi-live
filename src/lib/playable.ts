import type { Playable, ResourceRow, PlaylistItemRow } from "@/lib/types";

// Convierte entidades del catálogo al shape `Playable` que consumen `PlayerPanel`
// y `VideoListItem`, para reutilizarlos sin cambios. Funciones puras (server-safe).

export function resourceToPlayable(r: ResourceRow): Playable {
  return {
    videoId: r.youtube_id,
    title: r.title,
    thumbnailUrl:
      r.thumbnail_url ?? `https://i.ytimg.com/vi/${r.youtube_id}/maxresdefault.jpg`,
    channelTitle: r.channel_title ?? "",
    watchUrl: `https://www.youtube.com/watch?v=${r.youtube_id}`,
    embedUrl: `https://www.youtube.com/embed/${r.youtube_id}?autoplay=1&rel=0`,
    publishedAt: r.published_at,
    // liveStartedAt alimenta la fecha relativa de PlayerPanel/VideoListItem; para
    // un video del catálogo la fecha relevante es la de publicación.
    liveStartedAt: r.published_at,
    liveEndedAt: null,
    isLive: false,
    durationSeconds: r.duration_seconds,
  };
}

export function playlistItemToPlayable(
  it: PlaylistItemRow,
  channelTitle: string | null
): Playable {
  return {
    videoId: it.youtube_video_id,
    title: it.title,
    thumbnailUrl:
      it.thumbnail_url ??
      `https://i.ytimg.com/vi/${it.youtube_video_id}/maxresdefault.jpg`,
    channelTitle: channelTitle ?? "",
    watchUrl: `https://www.youtube.com/watch?v=${it.youtube_video_id}`,
    embedUrl: `https://www.youtube.com/embed/${it.youtube_video_id}?autoplay=1&rel=0`,
    publishedAt: null,
    liveStartedAt: null,
    liveEndedAt: null,
    isLive: false,
    durationSeconds: null,
  };
}
