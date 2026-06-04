import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY_VALUE } from './config';

/**
 * Cliente Supabase para uso en el frontend (con anon key).
 * Úsalo para llamadas directas a Supabase Auth o consultas públicas.
 * Para operaciones autenticadas del negocio, usa la Edge Function (API_BASE).
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY_VALUE);

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
