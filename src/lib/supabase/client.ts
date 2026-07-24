import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para el navegador (Client Components). Lee/escribe la
// sesión en cookies, así que el server y el cliente comparten el mismo estado de
// auth. Distinto de src/lib/supabase.ts, que es para lecturas anon/admin sin sesión.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
