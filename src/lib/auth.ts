import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

// Usuario de la sesión actual (o null). Se lee desde Server Components, layouts y
// Route Handlers. El nombre visible sale de los metadatos del usuario (fijados en
// el registro), así no hace falta consultar `profiles` solo para la navegación.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email.split("@")[0];

  return { id: user.id, email: user.email, displayName };
}
