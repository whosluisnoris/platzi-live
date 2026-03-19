import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface StoredStream {
  id: string;
  video_id: string;
  title: string;
  channel_title: string;
  added_at: string;
}

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
