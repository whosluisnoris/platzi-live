import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

// Layout compartido del catálogo: barra de navegación con sesión + pie de página.
// La encuesta flotante NO vive aquí: su pregunta es sobre Platzi Lives, así que
// solo se monta en esa página.
export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      {children}
      <SiteFooter />
    </div>
  );
}
