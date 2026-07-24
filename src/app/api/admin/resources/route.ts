import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { createResourceFromUrl, setCategories, cleanCategoryIds } from "@/lib/resources";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

// POST /api/admin/resources — alta de un recurso (video suelto o playlist).
// Curado por el admin: sin submitted_by. Comparte la lógica con los envíos de la
// comunidad (src/lib/resources.ts).
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const url = typeof body.url === "string" ? body.url : "";
  const categoryIds = cleanCategoryIds(body.categoryIds);
  const manualTitle =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

  const result = await createResourceFromUrl(getSupabaseAdmin(), {
    url,
    categoryIds,
    manualTitle,
    submittedBy: null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsTitle: result.needsTitle },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    resourceId: result.resourceId,
    kind: result.kind,
    imported: result.imported,
    warning: result.warning,
  });
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
