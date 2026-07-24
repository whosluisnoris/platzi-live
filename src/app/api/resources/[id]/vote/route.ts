import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/resources/[id]/vote — voto de un usuario sobre un recurso.
// body: { value: 1 | -1 | 0 }  (0 = quitar el voto). Un trigger mantiene
// resources.vote_count sincronizado; devolvemos el puntaje ya actualizado.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para votar." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { value?: unknown };
  const value = body.value === 1 || body.value === -1 ? body.value : 0;

  const admin = getSupabaseAdmin();

  const { error } =
    value === 0
      ? await admin
          .from("resource_votes")
          .delete()
          .eq("resource_id", id)
          .eq("user_id", user.id)
      : await admin
          .from("resource_votes")
          .upsert(
            { resource_id: id, user_id: user.id, value },
            { onConflict: "resource_id,user_id" }
          );

  if (error) {
    const notFound = error.code === "23503"; // FK: recurso inexistente
    return NextResponse.json(
      { error: notFound ? "Ese recurso ya no existe." : "No se pudo registrar el voto." },
      { status: notFound ? 404 : 400 }
    );
  }

  const { data } = await admin
    .from("resources")
    .select("vote_count")
    .eq("id", id)
    .single();

  return NextResponse.json({ ok: true, score: data?.vote_count ?? 0, userVote: value });
}
