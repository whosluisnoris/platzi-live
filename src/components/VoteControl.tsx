"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Control de votación de un recurso. Voto positivo/negativo con toggle y
// actualización optimista. Sin sesión, el clic lleva a /entrar. Diseñado para
// vivir dentro (o al lado) de un enlace de tarjeta: frena la navegación al votar.
export function VoteControl({
  resourceId,
  score,
  initialVote = 0,
  canVote,
  size = "sm",
}: {
  resourceId: string;
  score: number;
  initialVote?: number;
  canVote: boolean;
  size?: "sm" | "lg";
}) {
  const [vote, setVote] = useState<number>(initialVote);
  const [count, setCount] = useState<number>(score);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function cast(next: 1 | -1) {
    if (!canVote) {
      router.push(`/entrar?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pending) return;

    const newValue = vote === next ? 0 : next;
    const prevVote = vote;
    const prevCount = count;

    // Optimista.
    setVote(newValue);
    setCount(count - vote + newValue);
    setPending(true);

    try {
      const res = await fetch(`/api/resources/${resourceId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { score?: number; userVote?: number };
      if (typeof data.score === "number") setCount(data.score);
      if (typeof data.userVote === "number") setVote(data.userVote);
    } catch {
      setVote(prevVote);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  function handle(e: React.MouseEvent, next: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    cast(next);
  }

  const btn = size === "lg" ? "h-8 w-8 text-base" : "h-6 w-6 text-xs";
  const wrap = size === "lg" ? "gap-1 px-1.5 py-1" : "gap-0.5 px-1 py-0.5";
  const num = size === "lg" ? "min-w-6 text-sm" : "min-w-5 text-xs";

  return (
    <div
      className={`inline-flex items-center rounded-full bg-fill ring-1 ring-border ${wrap}`}
    >
      <button
        type="button"
        onClick={(e) => handle(e, 1)}
        aria-label="Votar útil"
        aria-pressed={vote === 1}
        className={`flex items-center justify-center rounded-full transition active:scale-90 ${btn} ${
          vote === 1
            ? "bg-accent/20 text-accent-ink"
            : "text-muted hover:bg-fill-strong hover:text-foreground"
        }`}
      >
        ▲
      </button>
      <span
        className={`text-center font-bold tabular-nums ${num} ${
          vote === 1 ? "text-accent-ink" : vote === -1 ? "text-blue-400" : "text-foreground"
        }`}
      >
        {count}
      </span>
      <button
        type="button"
        onClick={(e) => handle(e, -1)}
        aria-label="Votar poco útil"
        aria-pressed={vote === -1}
        className={`flex items-center justify-center rounded-full transition active:scale-90 ${btn} ${
          vote === -1
            ? "bg-blue-500/20 text-blue-400"
            : "text-muted hover:bg-fill-strong hover:text-foreground"
        }`}
      >
        ▼
      </button>
    </div>
  );
}
