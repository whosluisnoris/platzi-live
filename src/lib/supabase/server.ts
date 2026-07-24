import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase con sesión para el servidor (Server Components, Route
// Handlers y Server Actions). Lee la sesión de las cookies de la request; las
// escrituras de cookie solo funcionan en Route Handlers / Server Actions, por eso
// el setAll va envuelto en try/catch para no romper en Server Components (ahí el
// refresco de sesión lo hace el proxy).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component: ignorable, el proxy refresca.
          }
        },
      },
    }
  );
}
