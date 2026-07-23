import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// slug para la URL: minúsculas, números y guiones (kebab-case)
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function cleanColor(v: unknown): string | null | undefined {
  if (typeof v !== "string") return undefined;
  const c = v.trim();
  if (c === "") return null;
  return HEX_RE.test(c) ? c : undefined;
}

// GET /api/admin/categories — todas las categorías (incluye inactivas)
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ categories: data ?? [] });
}

// POST /api/admin/categories — crea una categoría
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido (usa minúsculas, números y guiones)" },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // sort_order = al final por defecto (máximo actual + 1)
  const { data: maxRow } = await admin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder =
    typeof body.sortOrder === "number"
      ? body.sortOrder
      : (maxRow?.sort_order ?? 0) + 1;

  const color = cleanColor(body.color);

  const { error } = await admin
    .from("categories")
    .insert({
      slug,
      name,
      description,
      sort_order: sortOrder,
      ...(color !== undefined && { color }),
    });

  if (error) {
    const conflict = error.code === "23505";
    return NextResponse.json(
      { error: conflict ? "Ya existe una categoría con ese slug" : error.message },
      { status: conflict ? 409 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/categories — actualiza nombre/descr/orden/activo
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.description === "string")
    updates.description = body.description.trim() || null;
  if (typeof body.sortOrder === "number") updates.sort_order = body.sortOrder;
  if (typeof body.isActive === "boolean") updates.is_active = body.isActive;
  const color = cleanColor(body.color);
  if (color !== undefined) updates.color = color;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("categories")
    .update(updates)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/categories — borra una categoría (las relaciones caen por cascade)
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("categories").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
