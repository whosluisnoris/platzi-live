// Categoría del catálogo (tal como llega de la tabla `categories`).
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  color: string | null;
  created_at?: string;
}

export type ResourceKind = "video" | "playlist";

// Idioma hablado del video (no el de la interfaz). Lo elige quien lo aporta y
// alimenta el filtro de idioma de la exploración.
export type ResourceLanguage = "es" | "en";

// Recurso del catálogo (tal como llega de la tabla `resources`).
export interface ResourceRow {
  id: string;
  kind: ResourceKind;
  youtube_id: string;
  title: string;
  channel_title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_count: number | null;
  duration_seconds: number | null;
  published_at: string | null;
  added_at: string;
  synced_at: string | null;
  source: string;
  vote_count: number;
  language: ResourceLanguage;
  submitted_by?: string | null;
  status?: string;
}

// Item de una playlist (tal como llega de la tabla `playlist_items`).
export interface PlaylistItemRow {
  id: string;
  playlist_resource_id: string;
  position: number;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
}

// Forma común de cualquier video reproducible en la plataforma: miniatura,
// enlaces de watch/embed y metadatos opcionales de fecha/duración. La satisfacen
// un video suelto y un episodio de playlist del catálogo, así que `PlayerPanel`
// y `VideoListItem` operan sobre este tipo.
export interface Playable {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  watchUrl: string;
  embedUrl: string;
  publishedAt: string | null;
  liveStartedAt: string | null;
  liveEndedAt: string | null;
  isLive: boolean;
  durationSeconds: number | null;
}
