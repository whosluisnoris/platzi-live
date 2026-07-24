import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel Admin · Clusly" };

// Panel de administración. Acceso solo para staff (owner/admin): la sesión se
// resuelve en el servidor y se redirige a quien no tenga rol suficiente. Las
// rutas /api/admin/* vuelven a validar el rol en cada llamada (no basta con
// llegar a esta página).
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");
  if (!isStaff(user.role)) redirect("/");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Panel <span className="text-accent-ink">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Organiza recursos de aprendizaje y los lives de Platzi
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-fill px-3 py-1 text-xs font-semibold text-muted ring-1 ring-border">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {user.displayName} · {user.role}
        </span>
      </div>

      <AdminDashboard />
    </main>
  );
}
