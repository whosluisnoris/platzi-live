import { getSupabase } from "@/lib/supabase";
import type { Category, ResourceRow, PlaylistItemRow } from "@/lib/types";

// Lecturas del catálogo desde Server Components. Usan el cliente anon (la RLS
// permite SELECT público en categories/resources/playlist_items), así que no
// hace falta una capa /api para leer — solo las escrituras pasan por /api/admin.

const RESOURCE_COLS =
  "id, kind, youtube_id, title, channel_title, description, thumbnail_url, video_count, duration_seconds, published_at, added_at, synced_at, source, vote_count";

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

// Recursos de una categoría (join interno por resource_categories), de más a
// menos votados.
export async function getResourcesByCategory(categoryId: string): Promise<ResourceRow[]> {
  const { data } = await getSupabase()
    .from("resources")
    .select(`${RESOURCE_COLS}, resource_categories!inner(category_id)`)
    .eq("resource_categories.category_id", categoryId)
    .order("vote_count", { ascending: false })
    .order("added_at", { ascending: false });
  return ((data as ResourceRow[] | null) ?? []).map(stripJoin);
}

// Todos los recursos.
export async function getAllResources(): Promise<ResourceRow[]> {
  const { data } = await getSupabase()
    .from("resources")
    .select(RESOURCE_COLS)
    .order("vote_count", { ascending: false })
    .order("added_at", { ascending: false });
  return (data as ResourceRow[] | null) ?? [];
}

export type ResourceSort = "top" | "new";

// Exploración con filtros: por categorías (unión de slugs) y orden (más votados o
// más recientes). Resuelve slugs→ids y luego los recursos en esos ids, para no
// duplicar filas cuando un recurso pertenece a varias categorías seleccionadas.
export async function getResourcesFiltered(opts: {
  categorySlugs?: string[];
  sort?: ResourceSort;
}): Promise<ResourceRow[]> {
  const sort = opts.sort ?? "top";
  const orderCol = sort === "new" ? "added_at" : "vote_count";
  const supabase = getSupabase();

  let query = supabase.from("resources").select(RESOURCE_COLS);

  const slugs = opts.categorySlugs?.filter(Boolean) ?? [];
  if (slugs.length > 0) {
    const { data: cats } = await supabase.from("categories").select("id").in("slug", slugs);
    const catIds = ((cats as { id: string }[] | null) ?? []).map((c) => c.id);
    if (catIds.length === 0) return [];

    const { data: links } = await supabase
      .from("resource_categories")
      .select("resource_id")
      .in("category_id", catIds);
    const ids = [
      ...new Set(((links as { resource_id: string }[] | null) ?? []).map((l) => l.resource_id)),
    ];
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data } = await query
    .order(orderCol, { ascending: false })
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

// Etiqueta de categoría para mostrar en las tarjetas (a qué filtro pertenece).
export interface CategoryTag {
  slug: string;
  name: string;
  color: string | null;
}

interface CategoryJoinRow {
  resource_id: string;
  categories: { slug: string; name: string; color: string | null; sort_order: number } | null;
}

// Categorías de un conjunto de recursos, como mapa resourceId → etiquetas
// (ordenadas por sort_order). Se usa para pintar en cada tarjeta a qué filtro(s)
// pertenece el video.
export async function getCategoriesForResources(
  resourceIds: string[]
): Promise<Record<string, CategoryTag[]>> {
  if (resourceIds.length === 0) return {};
  const { data } = await getSupabase()
    .from("resource_categories")
    .select("resource_id, categories(slug, name, color, sort_order)")
    .in("resource_id", resourceIds);

  const tmp: Record<string, (CategoryTag & { order: number })[]> = {};
  for (const row of (data as CategoryJoinRow[] | null) ?? []) {
    const cat = row.categories;
    if (!cat) continue;
    (tmp[row.resource_id] ??= []).push({
      slug: cat.slug,
      name: cat.name,
      color: cat.color,
      order: cat.sort_order,
    });
  }

  const map: Record<string, CategoryTag[]> = {};
  for (const [id, tags] of Object.entries(tmp)) {
    map[id] = tags
      .sort((a, b) => a.order - b.order)
      .map(({ slug, name, color }) => ({ slug, name, color }));
  }
  return map;
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
