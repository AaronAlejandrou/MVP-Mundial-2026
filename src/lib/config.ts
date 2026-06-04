/**
 * config.ts — Configuración centralizada del proyecto.
 *
 * Todas las URLs y constantes de entorno se leen desde aquí.
 * Para cambiar de proyecto Supabase solo hay que tocar este archivo
 * (o las variables de entorno .env).
 */

const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "nbfkvpqaosisyuhilrsu";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmt2cHFhb3Npc3l1aGlscnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNzE4MzYsImV4cCI6MjA5NTg0NzgzNn0.MrR4nXezOxAuW53S_qx0Knn633wTcGM3Dz5bgg790Ek";

/** URL base de Supabase */
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

/** Anon key pública */
export const SUPABASE_ANON_KEY_VALUE = SUPABASE_ANON_KEY;

/** URL base de la Edge Function del servidor */
export const API_BASE = `${SUPABASE_URL}/functions/v1/make-server-49810636`;
