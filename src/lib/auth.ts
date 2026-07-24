import { createSupabaseServerClient } from "@/lib/supabase/server";

// Roles de la plataforma. `owner` y `admin` son "staff" (acceden al panel);
// `user` es la cuenta normal. El rol vive en `profiles.role` y solo el service
// role puede cambiarlo (ver migración 0002).
export type Role = "owner" | "admin" | "user";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

// ¿El rol tiene acceso al panel de administración?
export function isStaff(role: Role | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

// Usuario de la sesión actual (o null). Se lee desde Server Components, layouts y
// Route Handlers. El nombre visible sale de los metadatos del usuario (fijados en
// el registro); el rol se lee de `profiles` (lectura pública por RLS).
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email.split("@")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = ((profile?.role as Role | undefined) ?? "user") satisfies Role;

  return { id: user.id, email: user.email, displayName, role };
}
