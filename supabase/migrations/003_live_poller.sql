-- ============================================================
-- Polla Mundial 2026 - Migración 003: Poller de resultados en vivo
-- SEGURA: solo agrega columnas y relaja un constraint.
-- No modifica ningún dato existente.
-- ============================================================

-- source: quién escribió el resultado
--   'manual' = admin desde AdminPanel (default para filas existentes)
--   'auto'   = poller automático (TheSportsDB)
-- El poller nunca sobrescribe filas con source='manual'.
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- api_status: strStatus crudo de la API ('1H','HT','2H','FT',...)
-- NULL para filas existentes (escritas por admin antes de esta migración).
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS api_status TEXT;

-- minuto: strProgress crudo de la API ('67', '90+3', ...)
-- NULL para filas existentes.
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS minuto TEXT;

-- updated_by pasa a nullable para permitir filas automáticas sin user_id.
-- FK sigue activa para valores no-null (filas de admin conservan su updated_by).
-- Filas existentes no se modifican.
ALTER TABLE match_results
  ALTER COLUMN updated_by DROP NOT NULL;

-- Índice útil para el poller: buscar partidos vivos por match_id + league_id.
-- Ya existe el UNIQUE (match_id, league_id) que actúa como índice implícito.
-- No se necesita índice adicional.

-- Verificación de seguridad: las filas existentes deben tener source='manual'
-- (el DEFAULT se aplica automáticamente en el ADD COLUMN).
-- Nada más que hacer.
