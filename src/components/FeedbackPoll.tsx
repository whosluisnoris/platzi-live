"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/analytics";

const QUESTION_ID = "live_platform_v1";
const STORAGE_KEY = `pl_poll_${QUESTION_ID}`;
const DISMISS_KEY = `pl_poll_${QUESTION_ID}_cerrada`;

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

function readStoredVote(): Answer | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "si" || v === "puede_mejorar" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

async function fetchResults(): Promise<Results | null> {
  try {
    const res = await fetch(`/api/feedback?question=${QUESTION_ID}`);
    if (!res.ok) return null;
    return (await res.json()) as Results;
  } catch {
    return null;
  }
}

// Encuesta flotante tipo notificación: esquina inferior derecha, se puede
// cerrar y reabrir con la pastilla "📊 Encuesta".
export function FeedbackPoll() {
  const [open, setOpen] = useState(false);
  const [voted, setVoted] = useState<Answer | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [changing, setChanging] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  // Estado inicial (async para no divergir del SSR): recupera el voto y
  // auto-abre tras un momento solo si nunca votó ni la cerró antes.
  useEffect(() => {
    const stored = readStoredVote();
    const dismissed = (() => {
      try {
        return localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        return false;
      }
    })();

    if (stored) {
      fetchResults().then((r) => {
        setVoted(stored);
        if (r) setResults(r);
      });
    }

    if (!stored && !dismissed) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
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
    if (voted && !results) setResults(await fetchResults());
  }

  async function vote(answer: Answer) {
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: QUESTION_ID,
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
      setResults(await fetchResults());
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  const showOptions = !voted || changing;

  return (
    <>
      {/* Pastilla para reabrir cuando está cerrada */}
      <button
        onClick={reopen}
        aria-label="Abrir encuesta"
        className={`glass backdrop-blur-md fixed bottom-5 right-5 z-50 rounded-full px-4 py-2.5 text-sm font-semibold text-[#0aeb8b] shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
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
          <h2 className="text-sm font-bold text-white">
            📊 ¿Te gustaría que los lives de Platzi se vieran así?
          </h2>
          <button
            onClick={close}
            aria-label="Cerrar encuesta"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
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
                    ? "bg-[#0aeb8b] text-[#0e1013]"
                    : "bg-white/5 text-gray-200 ring-1 ring-white/10 hover:bg-[#0aeb8b]/15 hover:text-[#0aeb8b]"
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
                      mine ? "font-bold text-[#0aeb8b]" : "text-gray-300"
                    }`}
                  >
                    {o.emoji} {o.label}
                    {mine && " ✓"}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${
                        mine ? "bg-[#0aeb8b]" : "bg-white/20"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-gray-400">
                    {pct}%
                  </span>
                </div>
              );
            })}
            <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
              <span>
                Gracias por tu opinión 💚
                {results
                  ? ` · ${results.total} ${results.total === 1 ? "voto" : "votos"}`
                  : ""}
              </span>
              <button
                onClick={() => setChanging(true)}
                className="text-[#0aeb8b] hover:underline"
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
