import type { LiveStream } from "./invidious";

// Radio lofi 24/7 de Claude: video por defecto cuando no hay un Platzi Live activo.
// No vive en la base de datos; es una constante de la aplicación.
export const LOFI_STREAM: LiveStream = {
  videoId: "tRsQsTMvPNg",
  title: "Radio lofi 24/7 — música para concentrarte",
  channelTitle: "Claude",
  thumbnailUrl: "https://i.ytimg.com/vi/tRsQsTMvPNg/maxresdefault.jpg",
  watchUrl: "https://www.youtube.com/watch?v=tRsQsTMvPNg",
  embedUrl: "https://www.youtube.com/embed/tRsQsTMvPNg?autoplay=1&rel=0",
  publishedAt: null,
  liveStartedAt: null,
  liveEndedAt: null,
  isLive: true,
  durationSeconds: null,
};
