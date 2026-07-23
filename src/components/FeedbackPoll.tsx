"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/analytics";

// Pregunta y texto por defecto (retrocompatibles con los votos ya recogidos).
// Para una pregunta post-pivot, pasa props distintas y añade el nuevo id a la
// lista blanca QUESTIONS en src/app/api/feedback/route.ts.
const DEFAULT_QUESTION_ID = "live_platform_v1";
const DEFAULT_TITLE = "¿Te gustaría tener una funcionalidad así en Platzi?";

type Answer = "si" | "puede_mejorar" | "no";

interface Results {
  total: number;
  counts: Record<Answer, number>;
}

const OPTIONS: { value: Answer; emoji: string; label: string }[] = [
  { value: "si", emoji: "😍", label: "Sí, me encanta" },
  { value: "puede_mejorar", emoji: "🤔", label: "Puede mejorar" },
  { value: "no", emoji: "😕", label: "No me convence" },
];

function readStoredVote(storageKey: string): Answer | null {
  try {
    const v = localStorage.getItem(storageKey);
    return v === "si" || v === "puede_mejorar" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

async function fetchResults(questionId: string): Promise<Results | null> {
  try {
    const res = await fetch(`/api/feedback?question=${questionId}`);
    if (!res.ok) return null;
    return (await res.json()) as Results;
  } catch {
    return null;
  }
}

// Encuesta flotante tipo notificación: esquina inferior derecha, se puede
// cerrar y reabrir con la pastilla "📊 Encuesta". La pregunta es parametrizable
// para poder cambiarla tras el pivot sin tocar la lógica.
export function FeedbackPoll({
  questionId = DEFAULT_QUESTION_ID,
  title = DEFAULT_TITLE,
}: {
  questionId?: string;
  title?: string;
} = {}) {
  const STORAGE_KEY = `pl_poll_${questionId}`;
  const DISMISS_KEY = `pl_poll_${questionId}_cerrada`;
  const COMMENT_KEY = `pl_poll_${questionId}_comentario`;

  const [open, setOpen] = useState(false);
  const [voted, setVoted] = useState<Answer | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [changing, setChanging] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  // Solo se usa en la vista de resultados (que aparece tras hidratar): sin
  // riesgo de divergencia con el SSR aunque lea localStorage al inicio.
  const [commentSent, setCommentSent] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(COMMENT_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Estado inicial (async para no divergir del SSR): recupera el voto y
  // auto-abre tras un momento solo si nunca votó ni la cerró antes.
  useEffect(() => {
    const stored = readStoredVote(STORAGE_KEY);
    const dismissed = (() => {
      try {
        return localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        return false;
      }
    })();

    if (stored) {
      fetchResults(questionId).then((r) => {
        setVoted(stored);
        if (r) setResults(r);
      });
    }

    if (!stored && !dismissed) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
    // Solo al montar: la pregunta no cambia durante la vida del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setOpen(false);
    setChanging(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sin persistencia, solo cierra */
    }
  }

  async function reopen() {
    setOpen(true);
    if (voted && !results) setResults(await fetchResults(questionId));
  }

  async function vote(answer: Answer) {
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answer,
          sessionId: getSessionId(),
        }),
      });
      if (!res.ok) throw new Error();
      try {
        localStorage.setItem(STORAGE_KEY, answer);
      } catch {
        /* sin localStorage el voto igual cuenta, solo no se recuerda */
      }
      setVoted(answer);
      setChanging(false);
      setResults(await fetchResults(questionId));
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !voted) return;
    setSendingComment(true);
    setError(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answer: voted,
          sessionId: getSessionId(),
          comment: text.slice(0, 500),
        }),
      });
      if (!res.ok) throw new Error();
      try {
        localStorage.setItem(COMMENT_KEY, "1");
      } catch {
        /* sin persistencia igual cuenta */
      }
      setCommentSent(true);
      setCommentText("");
    } catch {
      setError(true);
    } finally {
      setSendingComment(false);
    }
  }

  const showOptions = !voted || changing;

  return (
    <>
      {/* Pastilla para reabrir cuando está cerrada */}
      <button
        onClick={reopen}
        aria-label="Abrir encuesta"
        className={`glass backdrop-blur-md fixed bottom-5 right-5 z-50 rounded-full px-4 py-2.5 text-sm font-semibold text-accent shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          open ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"
        }`}
      >
        📊 Encuesta
      </button>

      {/* Tarjeta flotante */}
      <section
        aria-label="Encuesta"
        aria-hidden={!open}
        className={`glass backdrop-blur-md fixed bottom-5 left-4 right-4 z-50 rounded-2xl p-5 shadow-2xl transition-all duration-300 sm:left-auto sm:right-5 sm:w-[400px] ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">
            📊 {title}
          </h2>
          <button
            onClick={close}
            aria-label="Cerrar encuesta"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-muted transition hover:bg-fill-strong hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Tu opinión es anónima y nos ayuda a proponer esta sección.
        </p>

        {showOptions ? (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => vote(o.value)}
                disabled={sending}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50 ${
                  voted === o.value
                    ? "bg-accent text-on-accent"
                    : "bg-fill text-foreground ring-1 ring-border hover:bg-accent/15 hover:text-accent"
                }`}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {OPTIONS.map((o) => {
              const count = results?.counts[o.value] ?? 0;
              const total = results?.total ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const mine = voted === o.value;
              return (
                <div key={o.value} className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-36 shrink-0 ${
                      mine ? "font-bold text-accent" : "text-muted"
                    }`}
                  >
                    {o.emoji} {o.label}
                    {mine && " ✓"}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
                    <div
                      className={`h-full rounded-full ${
                        mine ? "bg-accent" : "bg-fill-strong"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-muted">
                    {pct}%
                  </span>
                </div>
              );
            })}
            {/* Comentario opcional */}
            {commentSent ? (
              <p className="mt-1 text-xs text-muted">
                💬 ¡Gracias por tu comentario!
              </p>
            ) : (
              <form onSubmit={sendComment} className="mt-1 flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="¿Quieres contarnos por qué? (opcional)"
                  className="w-full resize-none rounded-lg bg-fill px-3 py-2 text-xs text-foreground placeholder-faint ring-1 ring-border focus:outline-none focus:ring-accent/50"
                />
                {commentText.trim().length > 0 && (
                  <button
                    type="submit"
                    disabled={sendingComment}
                    className="self-end rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-on-accent transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {sendingComment ? "Enviando…" : "Enviar comentario"}
                  </button>
                )}
              </form>
            )}

            <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
              <span>
                Gracias por tu opinión 💚
                {results
                  ? ` · ${results.total} ${results.total === 1 ? "voto" : "votos"}`
                  : ""}
              </span>
              <button
                onClick={() => setChanging(true)}
                className="text-accent hover:underline"
              >
                Cambiar respuesta
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-400">
            No se pudo registrar tu voto, inténtalo de nuevo en un momento.
          </p>
        )}
      </section>
    </>
  );
}
