import type { LiveStream } from "./invidious";

const KEY = "platzi-live:saved-streams";

export function getSavedStreams(): LiveStream[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveStream(stream: LiveStream): void {
  const current = getSavedStreams();
  if (current.some((s) => s.videoId === stream.videoId)) return;
  localStorage.setItem(KEY, JSON.stringify([stream, ...current]));
}

export function removeStream(videoId: string): void {
  const updated = getSavedStreams().filter((s) => s.videoId !== videoId);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
