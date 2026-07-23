"use client";

import { useState, useCallback, useEffect } from "react";
import type { Category, ResourceRow, PlaylistItemRow } from "@/lib/types";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";

type AdminResource = ResourceRow & {
  resource_categories: { category_id: string }[];
};

export function ResourcesManager({ secret }: { secret: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [url, setUrl] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Edición de categorías por fila
  const [editId, setEditId] = useState<string | null>(null);
  const [editCats, setEditCats] = useState<string[]>([]);

  // Gestión de episodios de una playlist
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  const load = useCallback(async () => {
    const [catRes, resRes] = await Promise.all([
      fetch("/api/admin/categories", { headers }),
      fetch("/api/admin/resources", { headers }),
    ]);
    if (catRes.ok) setCategories((await catRes.json()).categories ?? []);
    if (resRes.ok) setResources((await resRes.json()).resources ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "?";
  const detected = parseYouTubeUrl(url);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!detected) {
      setStatus({ text: "Pega una URL de YouTube (video o playlist) válida", ok: false });
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        categoryIds: selectedCats,
        title: manualTitle.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUrl("");
      setSelectedCats([]);
      setManualTitle("");
      setShowTitle(false);
      setStatus({
        text: data.warning ?? `${data.kind === "playlist" ? "Playlist" : "Video"} agregado ✓`,
        ok: true,
      });
      await load();
    } else {
      if (data.needsTitle) setShowTitle(true);
      setStatus({ text: data.error ?? "No se pudo agregar", ok: false });
    }
    setLoading(false);
  }

  async function saveCats(id: string) {
    await fetch("/api/admin/resources", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, categoryIds: editCats }),
    });
    setEditId(null);
    await load();
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`¿Quitar "${title}" del catálogo? Esta acción no se puede deshacer.`))
      return;
    await fetch("/api/admin/resources", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-foreground">
        Recursos <span className="text-accent-ink">del catálogo</span>
      </h2>

      {/* Alta de recurso */}
      <form
        onSubmit={handleAdd}
        className="mb-6 flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-border"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Pega una URL de video o de playlist de YouTube…"
            className="flex-1 rounded-lg bg-background px-4 py-2 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-accent/50"
          />
          <button
            type="submit"
            disabled={loading || !detected}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-on-accent hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Agregando…" : "Agregar"}
          </button>
        </div>

        {url.trim() && (
          <p className="text-xs text-faint">
            {detected
              ? `Detectado: ${detected.kind === "playlist" ? "📚 Playlist" : "🎬 Video"} (${detected.id})`
              : "No se reconoce como video ni playlist de YouTube"}
          </p>
        )}

        {showTitle && (
          <input
            type="text"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Título de la playlist (no se pudo leer de YouTube)…"
            className="rounded-lg bg-background px-4 py-2 text-sm text-foreground ring-1 ring-amber-500/40 focus:outline-none focus:ring-amber-500/60"
          />
        )}

        <div>
          <p className="mb-2 text-xs text-muted">Categorías:</p>
          <CategoryMultiSelect
            categories={categories}
            selected={selectedCats}
            onChange={setSelectedCats}
          />
        </div>
      </form>

      {status && (
        <p className={`mb-4 text-sm ${status.ok ? "text-accent-ink" : "text-red-400"}`}>
          {status.text}
        </p>
      )}

      {/* Tabla de recursos */}
      {resources.length === 0 ? (
        <p className="text-sm text-muted">
          Aún no hay recursos. Pega arriba la URL de un video o una playlist de YouTube.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {resources.map((r) => (
            <li key={r.id} className="rounded-xl bg-surface ring-1 ring-border">
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        r.kind === "playlist"
                          ? "bg-[#4a90e0]/20 text-[#7fb3ea]"
                          : "bg-fill-strong text-muted"
                      }`}
                    >
                      {r.kind === "playlist" ? `Playlist · ${r.video_count ?? 0}` : "Video"}
                    </span>
                    <span className="truncate">{r.title}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-faint">
                    {r.channel_title ? `${r.channel_title} · ` : ""}
                    {r.youtube_id}
                  </p>

                  {/* Categorías del recurso */}
                  {editId === r.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <CategoryMultiSelect
                        categories={categories}
                        selected={editCats}
                        onChange={setEditCats}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveCats(r.id)}
                          className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-on-accent"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {r.resource_categories.length === 0 ? (
                        <span className="text-xs text-amber-500/80">Sin categoría</span>
                      ) : (
                        r.resource_categories.map((rc) => (
                          <span
                            key={rc.category_id}
                            className="rounded-full bg-fill px-2 py-0.5 text-[11px] text-muted"
                          >
                            {catName(rc.category_id)}
                          </span>
                        ))
                      )}
                      <button
                        onClick={() => {
                          setEditId(r.id);
                          setEditCats(r.resource_categories.map((rc) => rc.category_id));
                        }}
                        className="text-[11px] text-accent-ink hover:underline"
                      >
                        editar
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => remove(r.id, r.title)}
                    className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition"
                  >
                    Quitar
                  </button>
                  {r.kind === "playlist" && (
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="rounded-lg border border-[#4a90e0]/40 px-3 py-1.5 text-xs text-[#7fb3ea] hover:bg-[#4a90e0]/10 transition"
                    >
                      {expandedId === r.id ? "Cerrar" : "Episodios"}
                    </button>
                  )}
                </div>
              </div>

              {r.kind === "playlist" && expandedId === r.id && (
                <PlaylistItemsEditor resourceId={r.id} secret={secret} onCountChange={load} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Editor de episodios de una playlist: lista, agregar por URL, quitar, resync.
function PlaylistItemsEditor({
  resourceId,
  secret,
  onCountChange,
}: {
  resourceId: string;
  secret: string;
  onCountChange: () => void;
}) {
  const [items, setItems] = useState<PlaylistItemRow[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/resources/${resourceId}/items`, { headers });
    if (res.ok) setItems((await res.json()).items ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, secret]);

  useEffect(() => {
    load();
  }, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/resources/${resourceId}/items`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setUrl("");
      await load();
      onCountChange();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "No se pudo agregar");
    }
    setBusy(false);
  }

  async function removeItem(youtubeVideoId: string) {
    await fetch(`/api/admin/resources/${resourceId}/items`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ youtubeVideoId }),
    });
    await load();
    onCountChange();
  }

  async function resync() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/resources/${resourceId}/sync`, {
      method: "POST",
      headers,
    });
    const data = await res.json().catch(() => ({}));
    setMsg(
      res.ok
        ? `Sincronizado: ${data.total} videos${data.hasMore ? " (playlist larga, faltan algunos)" : ""}`
        : data.error ?? "No se pudo sincronizar"
    );
    await load();
    onCountChange();
    setBusy(false);
  }

  return (
    <div className="border-t border-border bg-background/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">
          Episodios ({items.length})
        </p>
        <button
          onClick={resync}
          disabled={busy}
          className="rounded-lg border border-accent/30 px-3 py-1 text-xs text-accent-ink hover:bg-accent/10 disabled:opacity-50 transition"
        >
          {busy ? "…" : "Resincronizar con YouTube"}
        </button>
      </div>

      <form onSubmit={addItem} className="mb-3 flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Agregar un video por URL/ID…"
          className="flex-1 rounded-lg bg-background px-3 py-1.5 text-xs text-foreground ring-1 ring-border focus:outline-none focus:ring-accent/50"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="rounded-lg bg-fill-strong px-3 py-1.5 text-xs text-foreground hover:bg-fill-strong disabled:opacity-50 transition"
        >
          Agregar
        </button>
      </form>

      {msg && <p className="mb-2 text-xs text-muted">{msg}</p>}

      {items.length === 0 ? (
        <p className="text-xs text-faint">Sin episodios todavía.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-fill"
            >
              <span className="min-w-0 truncate text-muted">
                <span className="text-faint">{it.position}.</span> {it.title}
              </span>
              <button
                onClick={() => removeItem(it.youtube_video_id)}
                className="shrink-0 text-red-400/70 hover:text-red-400"
                aria-label="Quitar episodio"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
