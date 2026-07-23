import type { Playable } from "./types";

// `LiveStream` es el nombre histórico de `Playable`; se conserva como alias para
// no tocar los imports existentes (hooks, componentes, rutas). Cualquier archivo
// nuevo puede importar `Playable` directamente desde `@/lib/types`.
export type LiveStream = Playable;

// Metadatos de un video individual, extraídos de su página watch
export interface VideoDetails {
  publishedAt: string | null;
  liveStartedAt: string | null;
  liveEndedAt: string | null;
  isLiveNow: boolean;
  durationSeconds: number | null;
  channelId: string | null;
}

export const PLATZI_CHANNEL_ID = "UC55-mxUj5Nj3niXFReG44OQ";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── YouTube page scraping (no API key required) ───────────────────────────────

interface VideoRenderer {
  videoId?: string;
  title?: { runs?: Array<{ text?: string }>; simpleText?: string };
  ownerText?: { runs?: Array<{ text?: string }> };
  thumbnailOverlays?: Array<{
    thumbnailOverlayTimeStatusRenderer?: { style?: string };
  }>;
  badges?: Array<{ metadataBadgeRenderer?: { style?: string } }>;
}

interface RawData {
  contents?: unknown;
  header?: unknown;
  [key: string]: unknown;
}

// Formato nuevo (comprobado en producción): YouTube migró los listados de
// canal a "view models" — cada video llega como lockupViewModel con contentId,
// y ya no hay ningún videoRenderer en ytInitialData.
interface LockupViewModel {
  contentId?: string;
  contentType?: string;
  metadata?: { lockupMetadataViewModel?: { title?: { content?: string } } };
}

const YT_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

// Video normalizado desde cualquiera de las dos representaciones
interface ExtractedVideo {
  videoId: string;
  title: string | null;
  channelTitle: string | null;
  isLive: boolean;
}

function isLiveRenderer(v: VideoRenderer): boolean {
  return (
    (v.thumbnailOverlays ?? []).some(
      (o) => o.thumbnailOverlayTimeStatusRenderer?.style === "LIVE"
    ) ||
    (v.badges ?? []).some(
      (b) => b.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_LIVE_NOW"
    )
  );
}

function isLiveLockup(l: LockupViewModel): boolean {
  // El estado en vivo va en badges anidados cuya ruta exacta varía; se busca
  // el estilo *_LIVE o el texto del badge sobre el JSON del lockup completo.
  const s = JSON.stringify(l);
  return (
    /BADGE_STYLE[A-Z_]*LIVE/.test(s) ||
    /"text":"(LIVE|EN VIVO|EN DIRECTO)"/.test(s)
  );
}

function extractVideos(
  obj: unknown,
  depth = 0,
  out: ExtractedVideo[] = []
): ExtractedVideo[] {
  if (depth > 40 || !obj || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    for (const item of obj) extractVideos(item, depth + 1, out);
    return out;
  }
  const record = obj as Record<string, unknown>;
  if ("videoRenderer" in record || "gridVideoRenderer" in record) {
    const v = (record.videoRenderer ?? record.gridVideoRenderer) as VideoRenderer;
    if (v?.videoId) {
      out.push({
        videoId: v.videoId,
        title:
          v.title?.runs?.map((r) => r.text ?? "").join("") ??
          v.title?.simpleText ??
          null,
        channelTitle: v.ownerText?.runs?.map((r) => r.text ?? "").join("") ?? null,
        isLive: isLiveRenderer(v),
      });
    }
  }
  if ("lockupViewModel" in record) {
    const l = record.lockupViewModel as LockupViewModel;
    const id = l?.contentId;
    if (
      id &&
      YT_VIDEO_ID_RE.test(id) &&
      (l.contentType == null || l.contentType === "LOCKUP_CONTENT_TYPE_VIDEO")
    ) {
      out.push({
        videoId: id,
        title: l.metadata?.lockupMetadataViewModel?.title?.content ?? null,
        channelTitle: null,
        isLive: isLiveLockup(l),
      });
    }
  }
  for (const v of Object.values(record)) extractVideos(v, depth + 1, out);
  return out;
}

// Un video puede aparecer repetido (shelf + grid): es live si alguna copia lo marca
function dedupeVideos(videos: ExtractedVideo[]): ExtractedVideo[] {
  const byId = new Map<string, ExtractedVideo>();
  for (const v of videos) {
    const prev = byId.get(v.videoId);
    byId.set(
      v.videoId,
      prev
        ? {
            ...prev,
            title: prev.title ?? v.title,
            channelTitle: prev.channelTitle ?? v.channelTitle,
            isLive: prev.isLive || v.isLive,
          }
        : v
    );
  }
  return [...byId.values()];
}

function parseYtInitialData(html: string): RawData | null {
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const scriptEnd = html.indexOf(";</script>", start + marker.length);
  if (scriptEnd === -1) return null;
  try {
    return JSON.parse(html.slice(start + marker.length, scriptEnd));
  } catch {
    return null;
  }
}

function extractedToStream(v: ExtractedVideo): LiveStream {
  return {
    videoId: v.videoId,
    title: v.title ?? "Platzi Live",
    thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`,
    channelTitle: v.channelTitle ?? "Platzi",
    watchUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&rel=0`,
    publishedAt: null,
    liveStartedAt: null,
    liveEndedAt: null,
    isLive: true, // proviene de un listado de lives activos
    durationSeconds: null,
  };
}

async function fetchViaYouTubeScrape(): Promise<LiveStream[]> {
  const url = `https://www.youtube.com/channel/${PLATZI_CHANNEL_ID}/streams`;
  const res = await fetch(url, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`YouTube page returned ${res.status}`);

  const html = await res.text();
  const data = parseYtInitialData(html);
  if (!data) throw new Error("ytInitialData not found in page");

  return dedupeVideos(extractVideos(data))
    .filter((v) => v.isLive)
    .map(extractedToStream);
}

// ── Detección directa vía /live ──────────────────────────────────────────────
// youtube.com/channel/<id>/live sirve la página watch del live activo (si lo
// hay), con <link rel="canonical"> apuntando a watch?v=<id>. No depende del
// formato del listado /streams, que a veces omite lives recién iniciados.

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchViaLivePage(): Promise<LiveStream[]> {
  const url = `https://www.youtube.com/channel/${PLATZI_CHANNEL_ID}/live`;
  const res = await fetch(url, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`YouTube live page returned ${res.status}`);
  const html = await res.text();

  // Sin reproductor incrustado (comprobado en producción: YouTube sirve un
  // shell sin ytInitialPlayerResponse), el live puede venir igualmente en el
  // ytInitialData de la página como lockup marcado LIVE.
  if (!html.includes('"isLiveNow":true')) {
    const data = parseYtInitialData(html);
    if (!data) return [];
    return dedupeVideos(extractVideos(data))
      .filter((v) => v.isLive)
      .map(extractedToStream);
  }

  const videoId = firstMatch(
    html,
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})"/
  );
  if (!videoId) return [];

  const rawTitle = firstMatch(html, /<meta name="title" content="([^"]*)"/);
  return [
    {
      videoId,
      title: rawTitle ? decodeEntities(rawTitle) : "Platzi Live",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: "Platzi",
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      publishedAt: null,
      liveStartedAt: firstMatch(html, /"startTimestamp":"([^"]+)"/),
      liveEndedAt: null,
      isLive: true,
      durationSeconds: null,
    },
  ];
}

// ── Invidious fallback (best-effort) ─────────────────────────────────────────

const INVIDIOUS_INSTANCES = [
  "invidious.privacyredirect.com",
  "yt.artemislena.eu",
  "invidious.nerdvpn.de",
];

interface InvidiousVideo {
  videoId: string;
  title: string;
  author?: string;
  liveNow: boolean;
}

interface InvidiousResponse {
  videos?: InvidiousVideo[];
}

async function fetchViaInvidious(): Promise<LiveStream[]> {
  let lastError: unknown;
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `https://${instance}/api/v1/channels/${PLATZI_CHANNEL_ID}/videos?type=streams`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${instance}`);
      const data: InvidiousResponse = await res.json();
      return (data.videos ?? [])
        .filter((v) => v.liveNow)
        .map((v) => ({
          videoId: v.videoId,
          title: v.title,
          thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`,
          channelTitle: v.author ?? "Platzi",
          watchUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
          embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&rel=0`,
          publishedAt: null,
          liveStartedAt: null,
          liveEndedAt: null,
          isLive: true,
          durationSeconds: null,
        }));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchPlatziLiveStreams(): Promise<LiveStream[]> {
  // Dos vías en paralelo: /live (directa, un solo live) y el listado /streams
  // (cubre lives simultáneos). Cualquiera de las dos basta para detectar.
  const [livePage, streamsTab] = await Promise.allSettled([
    fetchViaLivePage(),
    fetchViaYouTubeScrape(),
  ]);

  if (livePage.status === "rejected" && streamsTab.status === "rejected") {
    // Fallback: Invidious API instances
    return fetchViaInvidious();
  }

  const merged: LiveStream[] = [];
  const seen = new Set<string>();
  for (const result of [livePage, streamsTab]) {
    if (result.status !== "fulfilled") continue;
    for (const s of result.value) {
      if (seen.has(s.videoId)) continue;
      seen.add(s.videoId);
      merged.push(s);
    }
  }
  return merged;
}

// ── Diagnóstico de detección (para /api/live?debug=SECRET) ───────────────────
// Reporta qué ve cada vía de detección desde el servidor, sin tocar la DB.

export async function diagnoseLiveDetection(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};

  try {
    const res = await fetch(`https://www.youtube.com/channel/${PLATZI_CHANNEL_ID}/live`, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();
    const data = parseYtInitialData(html);
    const videos = data ? dedupeVideos(extractVideos(data)) : [];
    out.livePage = {
      status: res.status,
      finalUrl: res.url,
      htmlLength: html.length,
      hasIsLiveNowTrue: html.includes('"isLiveNow":true'),
      hasYtInitialData: data !== null,
      lockupCountRaw: (html.match(/"lockupViewModel"/g) ?? []).length,
      videoCount: videos.length,
      liveVideoIds: videos.filter((v) => v.isLive).map((v) => v.videoId),
      canonicalVideoId: firstMatch(
        html,
        /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})"/
      ),
    };
  } catch (err) {
    out.livePage = { error: String(err) };
  }

  try {
    const res = await fetch(`https://www.youtube.com/channel/${PLATZI_CHANNEL_ID}/streams`, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();
    const data = parseYtInitialData(html);
    const info: Record<string, unknown> = {
      status: res.status,
      htmlLength: html.length,
      hasYtInitialData: data !== null,
      lockupCountRaw: (html.match(/"lockupViewModel"/g) ?? []).length,
      videoRendererCountRaw: (html.match(/"videoRenderer"/g) ?? []).length,
      badgeStylesRaw: [
        ...new Set(html.match(/"badgeStyle":"[A-Z_]+"/g) ?? []),
      ].slice(0, 10),
    };
    if (data) {
      const videos = dedupeVideos(extractVideos(data));
      info.videoCount = videos.length;
      info.liveVideoIds = videos.filter((v) => v.isLive).map((v) => v.videoId);
      info.sample = videos.slice(0, 3).map((v) => ({
        videoId: v.videoId,
        title: v.title?.slice(0, 60) ?? null,
        isLive: v.isLive,
      }));
    }
    out.streamsTab = info;
  } catch (err) {
    out.streamsTab = { error: String(err) };
  }

  return out;
}

// ── Metadatos por video (fechas exactas, sin API de Google) ──────────────────
// La página watch incrusta ytInitialPlayerResponse con publishDate y
// liveBroadcastDetails{startTimestamp,endTimestamp}; con eso basta un regex.

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1] : null;
}

export async function fetchVideoDetails(videoId: string): Promise<VideoDetails> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`YouTube watch page returned ${res.status}`);
  const html = await res.text();

  // YouTube a veces responde 200 con una página sin ytInitialPlayerResponse
  // (muro anti-bot / consentimiento). Eso no son metadatos "en null": es un
  // fallo, y tratarlo como éxito borraría fechas ya guardadas.
  if (!/"(publishDate|startTimestamp|lengthSeconds|isLiveNow)"/.test(html)) {
    throw new Error("YouTube watch page returned no player metadata");
  }

  const isLiveNow = firstMatch(html, /"isLiveNow":(true|false)/) === "true";
  const lengthRaw = firstMatch(html, /"lengthSeconds":"(\d+)"/);
  const length = lengthRaw ? parseInt(lengthRaw, 10) : null;

  return {
    publishedAt: firstMatch(html, /"publishDate":"([^"]+)"/),
    liveStartedAt: firstMatch(html, /"startTimestamp":"([^"]+)"/),
    liveEndedAt: firstMatch(html, /"endTimestamp":"([^"]+)"/),
    isLiveNow,
    // en un live activo lengthSeconds es 0: la duración real llega al terminar
    durationSeconds: length && length > 0 && !isLiveNow ? length : null,
    // Canal dueño del video, para descartar lives ajenos que YouTube mezcla
    // como recomendaciones en las páginas del canal.
    channelId:
      firstMatch(html, /<meta itemprop="(?:channelId|identifier)" content="(UC[0-9A-Za-z_-]{22})"/) ??
      firstMatch(html, /"channelId":"(UC[0-9A-Za-z_-]{22})"/),
  };
}

// ── Importación de playlists (scraping de youtube.com/playlist?list=) ─────────
// Misma filosofía que la detección de lives: se descarga la página pública y se
// parsea el `ytInitialData` embebido (sin YouTube Data API). Los videos llegan
// como `playlistVideoRenderer` (formato legado) o `lockupViewModel` (formato
// nuevo, el mismo que ya maneja `extractVideos` para los listados de canal).

export interface PlaylistItemData {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  position: number; // 1-based, orden dentro de la playlist
}

export interface PlaylistImport {
  title: string | null;
  channelTitle: string | null;
  items: PlaylistItemData[];
  hasMore: boolean; // true si YouTube dejó un continuation (playlist > ~100 videos)
}

interface PlaylistVideoRenderer {
  videoId?: string;
  title?: { runs?: Array<{ text?: string }>; simpleText?: string };
}

interface RawPlaylistItem {
  videoId: string;
  title: string | null;
}

// Recorre el árbol acumulando por separado los `playlistVideoRenderer` y los
// `lockupViewModel` de tipo video, preservando el orden de aparición (que en la
// página de playlist coincide con el orden de la lista). El caller prefiere los
// renderers y solo cae a los lockups si no hubo ninguno, para no contaminar con
// videos recomendados de la barra lateral.
function extractPlaylistItems(
  obj: unknown,
  depth: number,
  renderers: RawPlaylistItem[],
  lockups: RawPlaylistItem[]
): void {
  if (depth > 40 || !obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) extractPlaylistItems(item, depth + 1, renderers, lockups);
    return;
  }
  const record = obj as Record<string, unknown>;
  if ("playlistVideoRenderer" in record) {
    const v = record.playlistVideoRenderer as PlaylistVideoRenderer;
    if (v?.videoId && YT_VIDEO_ID_RE.test(v.videoId)) {
      renderers.push({
        videoId: v.videoId,
        title:
          v.title?.runs?.map((r) => r.text ?? "").join("") ??
          v.title?.simpleText ??
          null,
      });
    }
  }
  if ("lockupViewModel" in record) {
    const l = record.lockupViewModel as LockupViewModel;
    const id = l?.contentId;
    if (
      id &&
      YT_VIDEO_ID_RE.test(id) &&
      (l.contentType == null || l.contentType === "LOCKUP_CONTENT_TYPE_VIDEO")
    ) {
      lockups.push({
        videoId: id,
        title: l.metadata?.lockupMetadataViewModel?.title?.content ?? null,
      });
    }
  }
  for (const v of Object.values(record)) {
    extractPlaylistItems(v, depth + 1, renderers, lockups);
  }
}

// Devuelve el primer valor asociado a `key` en cualquier profundidad del árbol.
function findFirstValue(obj: unknown, key: string, depth = 0): unknown {
  if (depth > 40 || !obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findFirstValue(item, key, depth + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  const record = obj as Record<string, unknown>;
  if (key in record) return record[key];
  for (const v of Object.values(record)) {
    const r = findFirstValue(v, key, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

interface PlaylistHeaderRenderer {
  title?: { simpleText?: string; runs?: Array<{ text?: string }> };
  ownerText?: { runs?: Array<{ text?: string }> };
}

// Título y curador de la playlist. Prioriza el `playlistHeaderRenderer` del
// ytInitialData; cae al `<meta property="og:title">` (muy estable) si el formato
// del header cambió. El curador es best-effort: si no aparece, el admin lo edita.
function extractPlaylistMeta(
  data: RawData,
  html: string
): { title: string | null; channelTitle: string | null } {
  const header = findFirstValue(data, "playlistHeaderRenderer") as
    | PlaylistHeaderRenderer
    | undefined;
  const headerTitle =
    header?.title?.simpleText ??
    header?.title?.runs?.map((r) => r.text ?? "").join("") ??
    null;
  const ogTitle = firstMatch(html, /<meta property="og:title" content="([^"]*)"/);
  const channelTitle =
    header?.ownerText?.runs?.map((r) => r.text ?? "").join("") || null;
  return {
    title: headerTitle ?? (ogTitle ? decodeEntities(ogTitle) : null),
    channelTitle,
  };
}

export async function fetchPlaylistVideos(playlistId: string): Promise<PlaylistImport> {
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`YouTube playlist page returned ${res.status}`);
  const html = await res.text();
  const data = parseYtInitialData(html);
  if (!data) throw new Error("ytInitialData not found in playlist page");

  const renderers: RawPlaylistItem[] = [];
  const lockups: RawPlaylistItem[] = [];
  extractPlaylistItems(data, 0, renderers, lockups);
  const raw = renderers.length > 0 ? renderers : lockups;

  const seen = new Set<string>();
  const items: PlaylistItemData[] = [];
  for (const v of raw) {
    if (seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    items.push({
      videoId: v.videoId,
      title: v.title?.trim() || "Video",
      thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg`,
      position: items.length + 1,
    });
  }

  const meta = extractPlaylistMeta(data, html);
  return {
    title: meta.title,
    channelTitle: meta.channelTitle,
    items,
    // YouTube solo embebe la primera página (~100 videos); un continuation en el
    // JSON indica que hay más y que la importación quedó parcial.
    hasMore: html.includes('"continuationItemRenderer"') && items.length >= 100,
  };
}

// ── Diagnóstico de parseo de playlist (para verificar contra YouTube real) ────
// Análogo a `diagnoseLiveDetection`: reporta qué claves aparecen en la página de
// una playlist pública, para confirmar los supuestos del parser sin tocar la DB.

export async function diagnosePlaylistParsing(
  playlistId: string
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  try {
    const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(12_000),
    });
    const html = await res.text();
    const data = parseYtInitialData(html);
    const renderers: RawPlaylistItem[] = [];
    const lockups: RawPlaylistItem[] = [];
    if (data) extractPlaylistItems(data, 0, renderers, lockups);
    const meta = data ? extractPlaylistMeta(data, html) : { title: null, channelTitle: null };
    out.playlist = {
      status: res.status,
      htmlLength: html.length,
      hasYtInitialData: data !== null,
      playlistVideoRendererCountRaw: (html.match(/"playlistVideoRenderer"/g) ?? []).length,
      lockupCountRaw: (html.match(/"lockupViewModel"/g) ?? []).length,
      hasContinuation: html.includes('"continuationItemRenderer"'),
      hasPlaylistHeaderRenderer: html.includes('"playlistHeaderRenderer"'),
      extractedRenderers: renderers.length,
      extractedLockups: lockups.length,
      meta,
      sample: (renderers.length > 0 ? renderers : lockups).slice(0, 3),
    };
  } catch (err) {
    out.playlist = { error: String(err) };
  }
  return out;
}
