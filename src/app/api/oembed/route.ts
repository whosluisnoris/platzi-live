import { NextRequest, NextResponse } from "next/server";
import { fetchOEmbed } from "@/lib/oembed";

export const dynamic = "force-dynamic";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId || !VIDEO_ID_RE.test(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  // Defaults de Platzi Live: esta ruta la consume el alta de streams del admin.
  const info = await fetchOEmbed(videoId);
  return NextResponse.json({
    title: info.title ?? "Platzi Live",
    channelTitle: info.channelTitle ?? "Platzi",
  });
}
