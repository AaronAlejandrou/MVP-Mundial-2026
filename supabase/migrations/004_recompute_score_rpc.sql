-- ============================================================
-- Polla Mundial 2026 - Migración 004: Recálculo atómico de puntaje
-- SEGURA: solo agrega una función. No modifica datos ni tablas.
-- ============================================================
--
-- PROBLEMA QUE RESUELVE
-- --------------------
-- calculatePoints() recalculaba el total del usuario en dos pasos separados:
--   1) SELECT SUM(puntos_obtenidos)  (un round-trip)
--   2) UPSERT scores.total            (otro round-trip)
-- Esos dos pasos NO son atómicos. Cuando el poller automático y un resultado
-- manual del admin corren al mismo tiempo para el mismo usuario, dos recálculos
-- se intercalan y el último en escribir pisa el total con un valor stale.
-- Es la misma clase de race condition que corrompió la tabla en el incidente.
--
-- SOLUCIÓN
-- --------
-- Esta función serializa el recálculo por (league, user) con un advisory lock
-- de transacción. El lock se toma ANTES de leer el SUM, de modo que el segundo
-- recálculo siempre ve las predicciones ya commiteadas por el primero, y el
-- último en escribir produce el total CORRECTO (no stale). El lock se libera
-- automáticamente al terminar la transacción (cada llamada PostgREST es 1 tx).
--
-- Nota: NO escribe marcadores_exactos — esa columna no existe en `scores` y el
-- leaderboard deriva los exactos contando predictions con puntos_obtenidos = 5.

CREATE OR REPLACE FUNCTION recompute_user_score(p_league UUID, p_user UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INT;
BEGIN
  -- Serializa concurrentes para el mismo (league, user). Dos claves int32
  -- derivadas por hash evitan colisiones entre usuarios/ligas distintos.
  PERFORM pg_advisory_xact_lock(hashtext(p_league::text), hashtext(p_user::text));

  -- Tras el lock, este SELECT toma un snapshot fresco que incluye todo lo
  -- commiteado por el recálculo previamente serializado (predictions ya escritas).
  SELECT COALESCE(SUM(puntos_obtenidos), 0)
    INTO v_total
  FROM predictions
  WHERE league_id = p_league AND user_id = p_user;

  INSERT INTO scores (league_id, user_id, total, updated_at)
  VALUES (p_league, p_user, v_total, NOW())
  ON CONFLICT (league_id, user_id)
  DO UPDATE SET total = EXCLUDED.total, updated_at = EXCLUDED.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION recompute_user_score(UUID, UUID) TO service_role;
