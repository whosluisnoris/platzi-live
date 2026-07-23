"use client";

import { useState } from "react";
import { StreamsManager } from "@/components/admin/StreamsManager";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { ResourcesManager } from "@/components/admin/ResourcesManager";

type Tab = "catalogo" | "platzi" | "stats";

const TABS: { key: Tab; label: string }[] = [
  { key: "catalogo", label: "Catálogo" },
  { key: "platzi", label: "Platzi Lives" },
  { key: "stats", label: "Estadísticas" },
];

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("catalogo");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Verificación de contraseña con una ruta admin ligera (solo lectura).
    const res = await fetch("/api/admin/categories", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      setError("Contraseña incorrecta");
      return;
    }
    setAuthed(true);
    setError(null);
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0e1013] px-4">
        <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white">
              Panel <span className="text-[#0aeb8b]">Admin</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Gestiona el catálogo y los lives
            </p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Contraseña de administrador"
            className="rounded-lg bg-[#14171c] px-4 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#0aeb8b]/50"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="rounded-lg bg-[#0aeb8b] py-2 text-sm font-semibold text-[#0e1013] hover:bg-[#08c975] transition"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Panel <span className="text-[#0aeb8b]">Admin</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Organiza recursos de aprendizaje y los lives de Platzi
        </p>
      </div>

      {/* Pestañas internas */}
      <div className="mb-8 flex gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-[#0aeb8b] text-[#0aeb8b]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "catalogo" && (
        <>
          <CategoriesManager secret={secret} />
          <ResourcesManager secret={secret} />
        </>
      )}
      {tab === "platzi" && <StreamsManager secret={secret} />}
      {tab === "stats" && <StatsPanel secret={secret} />}
    </main>
  );
}
