// Metadatos básicos de un video vía el endpoint oEmbed público de YouTube
// (título y canal), sin API key. Devuelve `null` en cada campo si falla o falta,
// para que cada caller aplique su propio valor por defecto.
//
// Nota: oEmbed solo soporta videos individuales, no playlists.

export interface OEmbedInfo {
  title: string | null;
  channelTitle: string | null;
}

export async function fetchOEmbed(videoId: string): Promise<OEmbedInfo> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return { title: null, channelTitle: null };
    const data = (await res.json()) as { title?: string; author_name?: string };
    return {
      title: data.title ?? null,
      channelTitle: data.author_name ?? null,
    };
  } catch {
    return { title: null, channelTitle: null };
  }
}
