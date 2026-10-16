import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Badge, Page, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel Admin" };

// Panel de administración. Acceso solo para staff (owner/admin): la sesión se
// resuelve en el servidor y se redirige a quien no tenga rol suficiente. Las
// rutas /api/admin/* vuelven a validar el rol en cada llamada (no basta con
// llegar a esta página).
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");
  if (!isStaff(user.role)) redirect("/");

  return (
    <Page className="max-w-4xl">
      <PageHeader
        size="md"
        title={
          <>
            Panel <span className="text-accent-ink">Admin</span>
          </>
        }
        description="Organiza recursos de aprendizaje"
        actions={
          <Badge size="md" dot className="normal-case tracking-normal">
            {user.displayName} · {user.role}
          </Badge>
        }
      />

      <AdminDashboard />
    </Page>
  );
}
