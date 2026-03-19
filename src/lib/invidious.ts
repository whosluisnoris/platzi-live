export interface LiveStream {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  watchUrl: string;
  embedUrl: string;
}

const PLATZI_CHANNEL_ID = "UC55-mxUj5Nj3niXFReG44OQ";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── YouTube page scraping (no API key required) ───────────────────────────────

interface VideoRenderer {
  videoId?: string;
  title?: { runs?: Array<{ text?: string }> };
  ownerText?: { runs?: Array<{ text?: string }> };
  thumbnailOverlays?: Array<{
    thumbnailOverlayTimeStatusRenderer?: { style?: string };
  }>;
}

interface RawData {
  contents?: unknown;
  header?: unknown;
  [key: string]: unknown;
}

function extractVideoRenderers(obj: unknown, depth = 0): VideoRenderer[] {
  if (depth > 30 || !obj || typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => extractVideoRenderers(item, depth + 1));
  }
  const record = obj as Record<string, unknown>;
  if ("videoRenderer" in record) {
    return [record.videoRenderer as VideoRenderer];
  }
  return Object.values(record).flatMap((v) => extractVideoRenderers(v, depth + 1));
}

function isLiveRenderer(v: VideoRenderer): boolean {
  return (v.thumbnailOverlays ?? []).some(
    (o) => o.thumbnailOverlayTimeStatusRenderer?.style === "LIVE"
  );
}

function rendererToStream(v: VideoRenderer): LiveStream | null {
  const videoId = v.videoId;
  if (!videoId) return null;
  const title =
    v.title?.runs?.map((r) => r.text ?? "").join("") ?? "Platzi Live";
  const channelTitle =
    v.ownerText?.runs?.map((r) => r.text ?? "").join("") ?? "Platzi";
  return {
    videoId,
    title,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    channelTitle,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
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
        }));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchPlatziLiveStreams(): Promise<LiveStream[]> {
  // Primary: scrape YouTube channel page (no API key, works reliably)
  try {
    return await fetchViaYouTubeScrape();
  } catch {
    // Fallback: Invidious API instances
    return fetchViaInvidious();
  }
}
