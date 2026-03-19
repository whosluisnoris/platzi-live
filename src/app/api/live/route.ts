import { NextRequest, NextResponse } from "next/server";
import { fetchPlatziLiveStreams } from "@/lib/invidious";
import type { LiveStream } from "@/lib/invidious";

export const dynamic = "force-dynamic";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const IS_DEV = process.env.NODE_ENV !== "production";

export async function GET(request: NextRequest) {
  // ?test=VIDEO_ID — dev-only shortcut to preview the UI with a known video
  if (IS_DEV) {
    const testId = request.nextUrl.searchParams.get("test");
    if (testId) {
      if (!VIDEO_ID_RE.test(testId)) {
        return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
      }
      const mock: LiveStream = {
        videoId: testId,
        title: "[TEST] Platzi Live Stream",
        thumbnailUrl: `https://i.ytimg.com/vi/${testId}/maxresdefault.jpg`,
        channelTitle: "Platzi",
        watchUrl: `https://www.youtube.com/watch?v=${testId}`,
        embedUrl: `https://www.youtube.com/embed/${testId}?autoplay=1&rel=0`,
      };
      return NextResponse.json({ streams: [mock] });
    }
  }

  try {
    const streams = await fetchPlatziLiveStreams();
    return NextResponse.json({ streams });
  } catch (err) {
    const message =
      IS_DEV && err instanceof Error ? err.message : "Failed to fetch streams";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
