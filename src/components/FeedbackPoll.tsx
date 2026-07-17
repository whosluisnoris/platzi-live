"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/analytics";

const QUESTION_ID = "live_platform_v1";
const STORAGE_KEY = `pl_poll_${QUESTION_ID}`;

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

export function FeedbackPoll() {
  const [voted, setVoted] = useState<Answer | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [changing, setChanging] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  // Si esta sesión ya votó, mostrar directamente los resultados.
  // (Estados se asignan en callbacks async — el primer render coincide con el SSR.)
  useEffect(() => {
    const stored = readStoredVote();
    if (!stored) return;
    let cancelled = false;
    fetchResults().then((r) => {
      if (cancelled) return;
      setVoted(stored);
      if (r) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <section
      aria-label="Encuesta"
      className="rounded-2xl bg-[#0aeb8b]/[0.04] p-4 ring-1 ring-[#0aeb8b]/25"
    >
      <h2 className="text-sm font-bold text-white">
        📊 ¿Te gustaría que los lives de Platzi se vieran así?
      </h2>
      <p className="mt-0.5 text-xs text-gray-400">
        Tu opinión es anónima y nos ayuda a proponer esta sección.
      </p>

      {showOptions ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => vote(o.value)}
              disabled={sending}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50 ${
                voted === o.value
                  ? "bg-[#0aeb8b] text-[#13161c]"
                  : "bg-white/5 text-gray-200 ring-1 ring-white/10 hover:bg-[#0aeb8b]/15 hover:text-[#0aeb8b]"
              }`}
            >
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {OPTIONS.map((o) => {
            const count = results?.counts[o.value] ?? 0;
            const total = results?.total ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const mine = voted === o.value;
            return (
              <div key={o.value} className="flex items-center gap-2 text-xs">
                <span className={`w-36 shrink-0 ${mine ? "font-bold text-[#0aeb8b]" : "text-gray-300"}`}>
                  {o.emoji} {o.label}
                  {mine && " ✓"}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${mine ? "bg-[#0aeb8b]" : "bg-white/20"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-gray-400">{pct}%</span>
              </div>
            );
          })}
          <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
            <span>
              Gracias por tu opinión 💚
              {results ? ` · ${results.total} ${results.total === 1 ? "voto" : "votos"}` : ""}
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
  );
}
