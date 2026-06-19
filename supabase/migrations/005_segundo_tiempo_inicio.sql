-- ============================================================
-- Polla Mundial 2026 - Migración 005: Ancla del inicio del 2T
-- SEGURA: solo agrega una columna nullable. No modifica datos.
-- ============================================================
--
-- PROBLEMA QUE RESUELVE
-- --------------------
-- El minuto del segundo tiempo se estimaba desde la hora programada del kickoff
-- (asumiendo 15' de descanso), lo que se desfasa si el partido empieza tarde,
-- el descanso dura más, o el 1T tuvo mucho tiempo añadido.
--
-- SOLUCIÓN
-- --------
-- Guardamos el instante real en que el poller detecta por primera vez que el
-- partido entró al segundo tiempo (api_status = '2H'). El cliente calcula:
--   minuto 2T = 46 + (ahora − segundo_tiempo_inicio)
-- Esto es exacto e inmune a descansos largos, arranques tardíos y añadido del 1T.
-- Se setea UNA sola vez (no se sobrescribe), así un gol en el 2T no lo mueve.

ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS segundo_tiempo_inicio TIMESTAMPTZ;
