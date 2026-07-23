import type { LiveStream } from "./invidious";

// Nombre de la plataforma (marca). Punto ÚNICO de cambio para el rebrand: se usa
// en el header del catálogo, la landing y los metadatos. Provisional — ajústalo
// cuando decidas el nombre final.
export const SITE_NAME = "Rutas IA";
export const SITE_TAGLINE =
  "Recursos gratis para aprender IA y datos, en español y en orden.";

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
