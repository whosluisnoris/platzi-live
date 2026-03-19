import { NextRequest, NextResponse } from "next/server";
import { fetchPlatziLiveStreams } from "@/lib/invidious";
import { getSupabase } from "@/lib/supabase";
import type { LiveStream } from "@/lib/invidious";

export const dynamic = "force-dynamic";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const IS_DEV = process.env.NODE_ENV !== "production";

async function fetchStoredStreams(): Promise<LiveStream[]> {
  const { data, error } = await getSupabase()
    .from("streams")
    .select("video_id, title, channel_title")
    .order("added_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    videoId: row.video_id,
    title: row.title,
    thumbnailUrl: `https://i.ytimg.com/vi/${row.video_id}/maxresdefault.jpg`,
    channelTitle: row.channel_title,
    watchUrl: `https://www.youtube.com/watch?v=${row.video_id}`,
    embedUrl: `https://www.youtube.com/embed/${row.video_id}?autoplay=1&rel=0`,
  }));
}

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

  // Fetch both sources in parallel
  const [autoStreams, storedStreams] = await Promise.allSettled([
    fetchPlatziLiveStreams(),
    fetchStoredStreams(),
  ]);

  const auto = autoStreams.status === "fulfilled" ? autoStreams.value : [];
  const stored = storedStreams.status === "fulfilled" ? storedStreams.value : [];

  // Merge: stored streams first, then auto-detected, deduplicated
  const seen = new Set(stored.map((s) => s.videoId));
  const merged = [...stored, ...auto.filter((s) => !seen.has(s.videoId))];

  return NextResponse.json({ streams: merged });
}
