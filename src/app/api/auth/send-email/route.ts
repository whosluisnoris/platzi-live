import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { renderAuthEmail, type EmailActionType } from "@/lib/email/auth-email";

export const dynamic = "force-dynamic";

// POST /api/auth/send-email — "Send Email Hook" de Supabase Auth. Supabase llama
// aquí cada vez que necesita mandar un correo de auth (confirmación, recuperación,
// magic link…). Verificamos la firma (Standard Webhooks), construimos el enlace de
// acción hacia /auth/confirm y entregamos el correo diseñado con Resend.
//
// Requiere en el entorno:
//   RESEND_API_KEY          — API key de Resend
//   SEND_EMAIL_HOOK_SECRET  — secreto del hook que genera Supabase (v1,whsec_…)
//   EMAIL_FROM (opcional)   — remitente, ej. "Clusly <no-reply@clusly.com>"

interface HookPayload {
  user: { email: string; user_metadata?: { display_name?: string } };
  email_data: {
    token_hash: string;
    email_action_type: EmailActionType;
    redirect_to?: string;
    site_url: string;
  };
}

const TOLERANCE_SECONDS = 5 * 60;

function verifySignature(rawBody: string, req: NextRequest, secret: string): boolean {
  const id = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const signature = req.headers.get("webhook-signature");
  if (!id || !timestamp || !signature) return false;

  // Anti-replay: la marca de tiempo no puede estar muy lejos de ahora.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^v1,whsec_/, "").replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");

  // El header trae una lista separada por espacios de entradas "v1,<firma>".
  return signature.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      const a = Buffer.from(sig, "base64");
      const b = Buffer.from(expected, "base64");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

// Resuelve el origen público de la app (p. ej. https://clusly.com) para construir
// el enlace de confirmación. NO se usa `email_data.site_url`: en el payload del hook
// ese campo es la URL de la API de auth de Supabase (https://<proj>.supabase.co/auth/v1),
// no el "Site URL" del dashboard. Usarlo generaba enlaces .../auth/v1/auth/confirm que
// el gateway de Supabase rechaza con "No API key found". Orden de confianza:
//   1) env explícita (NEXT_PUBLIC_SITE_URL / SITE_URL),
//   2) el host por el que Supabase llamó a este hook (clusly.com; la request está
//      firmada y verificada antes de llegar aquí),
//   3) el origen del redirect_to del signup,
//   4) site_url como último recurso.
function resolveAppOrigin(
  request: NextRequest,
  redirectTo: string | undefined,
  siteUrl: string
): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (env) return env.replace(/\/+$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  if (redirectTo) {
    try {
      return new URL(redirectTo).origin;
    } catch {
      /* redirect_to inválido: seguimos al último recurso */
    }
  }
  return siteUrl;
}

export async function POST(request: NextRequest) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey) {
    return NextResponse.json({ error: "Email hook no configurado" }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request, secret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawBody) as HookPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { user, email_data } = payload;
  const { token_hash, email_action_type, redirect_to, site_url } = email_data;

  const origin = resolveAppOrigin(request, redirect_to, site_url);

  // `next` debe ser una ruta relativa: la ruta /auth/confirm solo acepta paths
  // (los que empiezan con "/"). Extraemos el path del redirect_to del signup.
  let next = "/";
  if (redirect_to) {
    try {
      const u = new URL(redirect_to);
      next = `${u.pathname}${u.search}${u.hash}` || "/";
    } catch {
      /* redirect_to inválido: se queda en "/" */
    }
  }

  const actionUrl =
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(token_hash)}` +
    `&type=${encodeURIComponent(email_action_type)}` +
    `&next=${encodeURIComponent(next)}`;

  const { subject, html, text } = renderAuthEmail({
    type: email_action_type,
    actionUrl,
    name: user.user_metadata?.display_name,
  });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Clusly <onboarding@resend.dev>",
    to: user.email,
    subject,
    html,
    text,
  });

  if (error) {
    // Log el motivo real del rechazo de Resend: el 502 por sí solo no dice nada
    // en los logs de Vercel (dominio sin verificar, remitente inválido, API key…).
    console.error("[send-email] Resend rechazó el envío", {
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to: user.email,
      action: email_action_type,
      error: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({});
}
