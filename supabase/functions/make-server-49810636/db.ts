/**
 * db.tsx – Cliente Supabase singleton para la Edge Function.
 * Usa service_role key para bypassear RLS en operaciones del servidor.
 */
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2.49.8";

let _client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!_client) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos");
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
