import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Preguntas activas de la encuesta (lista blanca)
const QUESTIONS = new Set(["live_platform_v1"]);
const ANSWERS = ["si", "puede_mejorar", "no"] as const;
const ANSWER_SET = new Set<string>(ANSWERS);
const SESSION_RE = /^[A-Za-z0-9-]{8,64}$/;

function tryGetAdmin() {
  try {
    return getSupabaseAdmin();
  } catch {
    return null; // sin service key (p. ej. en local): la encuesta se desactiva sin romper nada
  }
}

// POST /api/feedback — registra el voto de la sesión (volver a votar lo actualiza)
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { questionId, answer, sessionId } = (body ?? {}) as Record<string, unknown>;

  if (typeof questionId !== "string" || !QUESTIONS.has(questionId)) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }
  if (typeof answer !== "string" || !ANSWER_SET.has(answer)) {
    return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  }
  const session =
    typeof sessionId === "string" && SESSION_RE.test(sessionId) ? sessionId : null;

  const admin = tryGetAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Feedback disabled" }, { status: 503 });
  }

  // Con sesión: un voto por sesión (upsert). Sin sesión (localStorage
  // bloqueado): insert simple — los NULL no chocan con la restricción UNIQUE.
  const { error } = await admin.from("feedback_votes").upsert(
    { question_id: questionId, answer, session_id: session },
    { onConflict: "question_id,session_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}

// GET /api/feedback?question=... — agregados públicos (solo conteos, nunca sesiones)
export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question");
  if (!question || !QUESTIONS.has(question)) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const admin = tryGetAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Feedback disabled" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("feedback_votes")
    .select("answer")
    .eq("question_id", question);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<(typeof ANSWERS)[number], number> = {
    si: 0,
    puede_mejorar: 0,
    no: 0,
  };
  for (const row of (data ?? []) as { answer: string }[]) {
    if (ANSWER_SET.has(row.answer)) {
      counts[row.answer as (typeof ANSWERS)[number]] += 1;
    }
  }

  return NextResponse.json({ total: (data ?? []).length, counts });
}
