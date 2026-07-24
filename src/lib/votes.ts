import { getSupabaseAdmin } from "@/lib/supabase";

// Votos del usuario actual sobre un conjunto de recursos, como mapa
// resourceId → valor (+1 / -1). Se lee con el cliente service-role (la tabla
// resource_votes no tiene políticas públicas); siempre acotado por user_id.
export async function getUserVotes(
  userId: string,
  resourceIds: string[]
): Promise<Record<string, number>> {
  if (resourceIds.length === 0) return {};
  const { data } = await getSupabaseAdmin()
    .from("resource_votes")
    .select("resource_id, value")
    .eq("user_id", userId)
    .in("resource_id", resourceIds);

  const map: Record<string, number> = {};
  for (const row of (data as { resource_id: string; value: number }[] | null) ?? []) {
    map[row.resource_id] = row.value;
  }
  return map;
}

// El voto del usuario sobre un recurso puntual (para la página de detalle).
export async function getUserVote(userId: string, resourceId: string): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from("resource_votes")
    .select("value")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .maybeSingle();
  return (data as { value: number } | null)?.value ?? 0;
}
