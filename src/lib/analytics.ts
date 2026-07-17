"use client";

// Analítica anónima: un UUID por navegador (localStorage), sin datos personales.
// Los envíos son fire-and-forget: la analítica jamás debe romper la experiencia.

const SESSION_KEY = "pl_session_id";

export type WatchEventType = "play" | "open_youtube" | "autoplay_default";

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null; // localStorage bloqueado (modo incógnito estricto, etc.)
  }
}

export function trackEvent(videoId: string, eventType: WatchEventType): void {
  try {
    const payload = JSON.stringify({
      videoId,
      eventType,
      sessionId: getSessionId(),
    });
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/events", blob)) return;
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // nunca interrumpir la UX por analítica
  }
}
