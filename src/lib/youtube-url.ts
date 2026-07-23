// Detecta si lo que pegó el admin es un video individual o una playlist de
// YouTube, y extrae su ID. Acepta URLs (youtube.com, youtu.be, /embed, /live,
// /shorts) o un ID pelado.
//
// Regla clave para el caso ambiguo `watch?v=...&list=...`: se trata como VIDEO,
// no como playlist. Así, compartir un video que casualmente venía dentro de una
// playlist no importa la playlist completa; para importar una playlist hay que
// pegar su link puro (`/playlist?list=...`).

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID_RE = /^[A-Za-z0-9_-]{12,60}$/;

export type YouTubeTarget =
  | { kind: "video"; id: string }
  | { kind: "playlist"; id: string };

export function parseYouTubeUrl(input: string): YouTubeTarget | null {
  const clean = input.trim();
  if (!clean) return null;

  let url: URL | null = null;
  try {
    url = new URL(clean);
  } catch {
    url = null;
  }

  if (url) {
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return VIDEO_ID_RE.test(id) ? { kind: "video", id } : null;
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const v = url.searchParams.get("v");
      const list = url.searchParams.get("list");

      // watch?v=... (con o sin list) → video individual
      if (v && VIDEO_ID_RE.test(v)) return { kind: "video", id: v };

      // /playlist?list=... o cualquier list sin v → playlist
      if (url.pathname === "/playlist" || (list && !v)) {
        return list && PLAYLIST_ID_RE.test(list) ? { kind: "playlist", id: list } : null;
      }

      // /embed/<id>, /live/<id>, /shorts/<id>, /v/<id>
      const m = url.pathname.match(/^\/(?:embed|live|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return { kind: "video", id: m[1] };

      return null;
    }

    return null;
  }

  // No es URL: ID pelado. 11 caracteres → video; más largo con prefijo típico
  // de playlist (PL, UU, FL, LL, RD, OL…) → playlist.
  if (VIDEO_ID_RE.test(clean)) return { kind: "video", id: clean };
  if (/^(PL|UU|FL|LL|RD|OL|SP)/.test(clean) && PLAYLIST_ID_RE.test(clean)) {
    return { kind: "playlist", id: clean };
  }
  return null;
}
