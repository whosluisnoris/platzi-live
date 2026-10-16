// Opiniones de la sección /opiniones: qué piensan los usuarios de Clusly.
//
// Son **privadas**: llegan directo al equipo y solo se leen desde /admin →
// pestaña Opiniones. La página pública únicamente ofrece el formulario; nadie
// ve lo que escribieron los demás (ni los conteos).
//
// La tabla `site_feedback` no tiene políticas públicas: se escribe desde
// `/api/opinions` y se lee con el service role en `/api/admin/opinions`.
// `hidden_at` marca las que el equipo ya archivó.

export const SENTIMENTS = ["me_encanta", "puede_mejorar", "no_me_convence"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const SENTIMENT_META: Record<Sentiment, { emoji: string; label: string }> = {
  me_encanta: { emoji: "😍", label: "Me encanta" },
  puede_mejorar: { emoji: "🤔", label: "Puede mejorar" },
  no_me_convence: { emoji: "😕", label: "No me convence" },
};

export const MAX_MESSAGE = 1000;
export const MIN_MESSAGE = 3;

export function isSentiment(value: unknown): value is Sentiment {
  return typeof value === "string" && (SENTIMENTS as readonly string[]).includes(value);
}
