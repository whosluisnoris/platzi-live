import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getResourceByYoutubeId,
  getPlaylistItems,
  getCategoryBySlug,
} from "@/lib/catalog";
import { resourceToPlayable, playlistItemToPlayable } from "@/lib/playable";
import { ResourceDetail } from "@/components/ResourceDetail";
import type { Playable } from "@/lib/types";

export const dynamic = "force-dynamic";

// Etiqueta y destino del enlace "volver", según el origen (?from=slug|todo).
async function backTarget(from: string | undefined) {
  if (from && from !== "todo") {
    const cat = await getCategoryBySlug(from);
    if (cat) return { href: `/categoria/${cat.slug}`, label: cat.name };
  }
  return { href: "/todo", label: "Todo" };
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ youtubeId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { youtubeId } = await params;
  const { from } = await searchParams;

  const resource = await getResourceByYoutubeId(youtubeId);
  if (!resource) notFound();

  let episodes: Playable[] | null = null;
  if (resource.kind === "playlist") {
    const items = await getPlaylistItems(resource.id);
    episodes = items.map((it) => playlistItemToPlayable(it, resource.channel_title));
  }
  const main = resourceToPlayable(resource);
  const back = await backTarget(from);

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-8">
      <Link
        href={back.href}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-[#0aeb8b]"
      >
        ← Volver a {back.label}
      </Link>

      {resource.kind === "playlist" && (
        <div className="mb-5">
          <h1 className="text-xl font-bold text-white sm:text-2xl">{resource.title}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {resource.channel_title ? `${resource.channel_title} · ` : ""}
            Playlist · {resource.video_count ?? episodes?.length ?? 0} videos
          </p>
        </div>
      )}

      {resource.kind === "playlist" && (episodes?.length ?? 0) === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          Esta playlist aún no tiene videos.
        </p>
      ) : (
        <ResourceDetail main={main} episodes={episodes} />
      )}
    </main>
  );
}
