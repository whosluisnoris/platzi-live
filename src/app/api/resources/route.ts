import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createResourceFromUrl, cleanCategoryIds } from "@/lib/resources";
import { parseYouTubeUrl } from "@/lib/youtube-url";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/resources — envío de un video por un usuario registrado. Aparece
// público de inmediato (status='published') con submitted_by = usuario. Si el
// video ya existe, la restricción UNIQUE(kind, youtube_id) devuelve 409 y el
// cliente muestra "ya está en Clusly" con enlace al existente.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para aportar un video." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const url = typeof body.url === "string" ? body.url : "";
  const target = parseYouTubeUrl(url);
  const categoryIds = cleanCategoryIds(body.categoryIds);

  const result = await createResourceFromUrl(getSupabaseAdmin(), {
    url,
    categoryIds,
    manualTitle: null,
    submittedBy: user.id,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        // En un duplicado, deja que el cliente enlace al recurso existente.
        youtubeId: result.status === 409 ? target?.id : undefined,
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    kind: result.kind,
    youtubeId: target?.id,
    warning: result.warning,
  });
}
