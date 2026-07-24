import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserVotes } from "@/lib/votes";
import { ResourceGrid } from "@/components/ResourceGrid";
import { getCategoriesForResources } from "@/lib/catalog";
import type { ResourceRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis videos · Clusly" };

// Videos aportados por el usuario. Se leen con el cliente service-role para
// incluir también los ocultados por moderación (no visibles para el público).
export default async function MisVideosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/mis-videos");

  const { data } = await getSupabaseAdmin()
    .from("resources")
    .select("*")
    .eq("submitted_by", user.id)
    .order("added_at", { ascending: false });

  const all = (data as ResourceRow[] | null) ?? [];
  const published = all.filter((r) => r.status !== "hidden");
  const hidden = all.filter((r) => r.status === "hidden");
  const publishedIds = published.map((r) => r.id);
  const [userVotes, categoriesByResource] = await Promise.all([
    getUserVotes(user.id, publishedIds),
    getCategoriesForResources(publishedIds),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="brand-gradient mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Mis videos
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {all.length === 0
                ? "Aquí verás los videos que aportes a Clusly."
                : `${all.length} ${all.length === 1 ? "aporte" : "aportes"} · el puntaje sube con los votos de la comunidad.`}
            </p>
          </div>
        </div>
        <Link
          href="/enviar"
          className="brand-gradient rounded-full px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-95"
        >
          + Aportar video
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
          <p className="text-sm text-muted">
            Todavía no has aportado ningún video.
          </p>
          <Link
            href="/enviar"
            className="mt-3 inline-block text-sm font-semibold text-accent-ink underline decoration-2 underline-offset-4"
          >
            Aporta el primero →
          </Link>
        </div>
      ) : (
        <ResourceGrid
          resources={published}
          from="mis-videos"
          userVotes={userVotes}
          categoriesByResource={categoriesByResource}
          canVote
          empty="Todos tus videos están ocultos por ahora."
        />
      )}

      {hidden.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
            Ocultos por moderación ({hidden.length})
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {hidden.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-border"
              >
                <span className="truncate text-sm text-muted">{r.title}</span>
                <span className="shrink-0 rounded-full bg-fill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-faint">
                  Oculto
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
