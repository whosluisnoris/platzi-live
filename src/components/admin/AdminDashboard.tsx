"use client";

import { useState } from "react";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { ResourcesManager } from "@/components/admin/ResourcesManager";
import { OpinionsManager } from "@/components/admin/OpinionsManager";
import { BlogManager } from "@/components/admin/BlogManager";
import { Tabs } from "@/components/ui";

type Tab = "catalogo" | "blog" | "stats" | "opiniones";

const TABS: { key: Tab; label: string }[] = [
  { key: "catalogo", label: "Catálogo" },
  { key: "blog", label: "Blog" },
  { key: "stats", label: "Estadísticas" },
  { key: "opiniones", label: "Opiniones" },
];

// Cuerpo del panel admin (pestañas + managers). La autorización ya la resolvió
// el Server Component de /admin por rol de sesión; aquí no se maneja secreto: las
// rutas /api/admin/* autorizan por la cookie de sesión.
export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("catalogo");

  return (
    <>
      <Tabs items={TABS} value={tab} onChange={setTab} label="Secciones del panel" className="mb-8" />

      {tab === "catalogo" && (
        <div className="flex flex-col gap-14">
          <CategoriesManager />
          <ResourcesManager />
        </div>
      )}
      {tab === "blog" && <BlogManager />}
      {tab === "stats" && <StatsPanel />}
      {tab === "opiniones" && <OpinionsManager />}
    </>
  );
}
