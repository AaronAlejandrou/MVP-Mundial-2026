-- ============================================================
-- Polla Mundial 2026 - Tablas para bracket eliminatorio
-- ============================================================

-- Tabla de clasificación de grupos (posición final que admin confirma)
-- Guarda el orden final de los equipos en cada grupo tras la fase de grupos
CREATE TABLE IF NOT EXISTS group_standings_final (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  grupo       TEXT NOT NULL,         -- 'A', 'B', ... 'L'
  posicion    INT NOT NULL,          -- 1, 2, 3, 4
  equipo      TEXT NOT NULL,         -- nombre del equipo
  pts         INT NOT NULL DEFAULT 0,
  gf          INT NOT NULL DEFAULT 0,
  gc          INT NOT NULL DEFAULT 0,
  dif         INT NOT NULL DEFAULT 0,
  pj          INT NOT NULL DEFAULT 0,
  pg          INT NOT NULL DEFAULT 0,
  pe          INT NOT NULL DEFAULT 0,
  pp          INT NOT NULL DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, grupo, posicion)
);

-- Estado de la fase de grupos por liga
CREATE TABLE IF NOT EXISTS league_phase (
  league_id        UUID PRIMARY KEY REFERENCES leagues(id) ON DELETE CASCADE,
  group_stage_open BOOLEAN NOT NULL DEFAULT TRUE,   -- TRUE = fase grupos activa
  bracket_locked   BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = bracket confirmado
  locked_at        TIMESTAMPTZ,
  locked_by        UUID REFERENCES users(id),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partidos de la fase eliminatoria con equipos ya definidos
-- match_id 73-104 corresponden a los partidos del bracket
CREATE TABLE IF NOT EXISTS knockout_match_teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  match_id    INT NOT NULL,          -- mismo ID que en GROUP_STAGE_MATCHES (73-104)
  team1       TEXT NOT NULL,         -- nombre real del equipo
  team2       TEXT NOT NULL,         -- nombre real del equipo
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, match_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_group_standings_league ON group_standings_final(league_id, grupo);
CREATE INDEX IF NOT EXISTS idx_knockout_teams_league  ON knockout_match_teams(league_id, match_id);

-- RLS
ALTER TABLE group_standings_final ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_phase           ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_match_teams   ENABLE ROW LEVEL SECURITY;
