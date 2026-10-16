import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

interface OEmbedResponse {
  title?: string;
  author_name?: string;
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId || !VIDEO_ID_RE.test(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`oEmbed returned ${res.status}`);
    const data: OEmbedResponse = await res.json();
    return NextResponse.json({
      title: data.title ?? "Platzi Live",
      channelTitle: data.author_name ?? "Platzi",
    });
  } catch {
    // Return defaults if oEmbed fails (e.g. unlisted video)
    return NextResponse.json({ title: "Platzi Live", channelTitle: "Platzi" });
  }
}
