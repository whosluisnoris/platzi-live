export interface LiveStream {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  watchUrl: string;
  embedUrl: string;
  publishedAt: string | null;
  liveStartedAt: string | null;
  liveEndedAt: string | null;
  isLive: boolean;
  durationSeconds: number | null;
}

// Metadatos de un video individual, extraídos de su página watch
export interface VideoDetails {
  publishedAt: string | null;
  liveStartedAt: string | null;
  liveEndedAt: string | null;
  isLiveNow: boolean;
  durationSeconds: number | null;
}

const PLATZI_CHANNEL_ID = "UC55-mxUj5Nj3niXFReG44OQ";
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

function extractVideoRenderers(obj: unknown, depth = 0): VideoRenderer[] {
  if (depth > 40 || !obj || typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => extractVideoRenderers(item, depth + 1));
  }
  const record = obj as Record<string, unknown>;
  // La pestaña /streams usa videoRenderer, pero algunos layouts de canal
  // sirven gridVideoRenderer con la misma forma interna.
  if ("videoRenderer" in record) {
    return [record.videoRenderer as VideoRenderer];
  }
  if ("gridVideoRenderer" in record) {
    return [record.gridVideoRenderer as VideoRenderer];
  }
  return Object.values(record).flatMap((v) => extractVideoRenderers(v, depth + 1));
}

function isLiveRenderer(v: VideoRenderer): boolean {
  // YouTube marca un live activo con el overlay LIVE en la miniatura o con un
  // badge BADGE_STYLE_TYPE_LIVE_NOW junto al título, según el layout servido.
  return (
    (v.thumbnailOverlays ?? []).some(
      (o) => o.thumbnailOverlayTimeStatusRenderer?.style === "LIVE"
    ) ||
    (v.badges ?? []).some(
      (b) => b.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_LIVE_NOW"
    )
  );
}

function rendererToStream(v: VideoRenderer): LiveStream | null {
  const videoId = v.videoId;
  if (!videoId) return null;
  const title =
    v.title?.runs?.map((r) => r.text ?? "").join("") ??
    v.title?.simpleText ??
    "Platzi Live";
  const channelTitle =
    v.ownerText?.runs?.map((r) => r.text ?? "").join("") ?? "Platzi";
  return {
    videoId,
    title,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    channelTitle,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
    publishedAt: null,
    liveStartedAt: null,
    liveEndedAt: null,
    isLive: true, // proviene del listado de lives activos del canal
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

  // Extract ytInitialData JSON embedded in the page
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("ytInitialData not found in page");
  const jsonStart = start + marker.length;
  const scriptEnd = html.indexOf(";</script>", jsonStart);
  if (scriptEnd === -1) throw new Error("ytInitialData end not found");

  const data: RawData = JSON.parse(html.slice(jsonStart, scriptEnd));
  const renderers = extractVideoRenderers(data);
  return renderers
    .filter(isLiveRenderer)
    .map(rendererToStream)
    .filter((s): s is LiveStream => s !== null);
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

  // Sin transmisión activa la página no incrusta un reproductor en vivo
  if (!html.includes('"isLiveNow":true')) return [];

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
  };
}
