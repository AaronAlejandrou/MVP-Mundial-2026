/**
 * api.ts — Cliente HTTP centralizado para la Edge Function.
 *
 * Supabase requiere un Authorization header válido para invocar
 * Edge Functions. Usamos:
 *   - El anon key (JWT público) cuando el usuario NO está autenticado
 *   - El token de sesión propio cuando SÍ está autenticado
 *
 * Esto evita el error 401 "Missing authorization header".
 */
import { API_BASE, SUPABASE_ANON_KEY_VALUE } from './config';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiOptions {
  method?: Method;
  body?: unknown;
  token?: string;        // token de sesión del usuario (cuando está logueado)
}

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;

  // Si hay token de sesión propio lo usamos; si no, el anon key de Supabase
  const authToken = token ?? SUPABASE_ANON_KEY_VALUE;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${authToken}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return res;
}
