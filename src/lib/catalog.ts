import { getSupabase } from "@/lib/supabase";
import type { Category, ResourceRow, PlaylistItemRow } from "@/lib/types";

// Lecturas del catálogo desde Server Components. Usan el cliente anon (la RLS
// permite SELECT público en categories/resources/playlist_items), así que no
// hace falta una capa /api para leer — solo las escrituras pasan por /api/admin.

const RESOURCE_COLS =
  "id, kind, youtube_id, title, channel_title, description, thumbnail_url, video_count, duration_seconds, published_at, added_at, synced_at, source";

export async function getActiveCategories(): Promise<Category[]> {
  const { data } = await getSupabase()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data as Category[] | null) ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await getSupabase()
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Category | null) ?? null;
}

// Recursos de una categoría (join interno por resource_categories).
export async function getResourcesByCategory(categoryId: string): Promise<ResourceRow[]> {
  const { data } = await getSupabase()
    .from("resources")
    .select(`${RESOURCE_COLS}, resource_categories!inner(category_id)`)
    .eq("resource_categories.category_id", categoryId)
    .order("added_at", { ascending: false });
  return ((data as ResourceRow[] | null) ?? []).map(stripJoin);
}

// Todos los recursos (pestaña "Todo").
export async function getAllResources(): Promise<ResourceRow[]> {
  const { data } = await getSupabase()
    .from("resources")
    .select(RESOURCE_COLS)
    .order("added_at", { ascending: false });
  return (data as ResourceRow[] | null) ?? [];
}

export async function getResourceByYoutubeId(youtubeId: string): Promise<ResourceRow | null> {
  const { data } = await getSupabase()
    .from("resources")
    .select(RESOURCE_COLS)
    .eq("youtube_id", youtubeId)
    .limit(1);
  return ((data as ResourceRow[] | null) ?? [])[0] ?? null;
}

export async function getPlaylistItems(resourceId: string): Promise<PlaylistItemRow[]> {
  const { data } = await getSupabase()
    .from("playlist_items")
    .select("id, playlist_resource_id, position, youtube_video_id, title, thumbnail_url")
    .eq("playlist_resource_id", resourceId)
    .order("position", { ascending: true });
  return (data as PlaylistItemRow[] | null) ?? [];
}

// Conteo de recursos por categoría (para la landing). Tally en JS sobre las
// filas de la tabla puente — suficiente a la escala del catálogo curado.
export async function getCategoryResourceCounts(): Promise<Map<string, number>> {
  const { data } = await getSupabase()
    .from("resource_categories")
    .select("category_id");
  const counts = new Map<string, number>();
  for (const row of (data as { category_id: string }[] | null) ?? []) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }
  return counts;
}

// El join !inner mete `resource_categories` en la fila; se quita para dejar un
// ResourceRow limpio.
function stripJoin(row: ResourceRow & { resource_categories?: unknown }): ResourceRow {
  const { resource_categories: _omit, ...rest } = row;
  void _omit;
  return rest;
}
