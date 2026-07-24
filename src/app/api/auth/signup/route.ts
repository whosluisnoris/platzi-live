import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup — crea la cuenta. Con la confirmación por correo activada,
// no hay sesión hasta que el usuario confirma: Supabase dispara el Send Email Hook
// (/api/auth/send-email) que entrega el correo diseñado vía Resend.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 60)
      : email.split("@")[0];

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/mis-videos`,
    },
  });

  if (error) {
    const msg =
      error.code === "user_already_exists" || error.code === "email_exists"
        ? "Ya existe una cuenta con ese correo. Inicia sesión."
        : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Sin sesión = requiere confirmación por correo (comportamiento esperado).
  return NextResponse.json({ ok: true, needsConfirmation: !data.session });
}
