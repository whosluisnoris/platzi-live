import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

// Public client — anon key, safe to expose, used for reads
export function getSupabase(): SupabaseClient {
  if (!_public) {
    _public = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _public;
}

// Admin client — service role key, server-side only, used for writes
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _admin;
}

// Igual que getSupabaseAdmin pero devuelve null si falta la service key (p. ej.
// en local sin .env completo). Para funciones opcionales que deben degradarse
// sin tumbar la página en vez de reventar.
export function tryGetSupabaseAdmin(): SupabaseClient | null {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}
