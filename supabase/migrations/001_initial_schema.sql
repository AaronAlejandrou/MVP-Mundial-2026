-- ============================================================
-- Polla Mundial 2026 - Esquema relacional inicial
-- ============================================================

-- Tabla de usuarios (auth propio, sin depender de Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de sesiones activas
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

-- Tabla de ligas
CREATE TABLE IF NOT EXISTS leagues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  admin_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitation_code  TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de miembros de liga (con estado de aprobación)
CREATE TABLE IF NOT EXISTS league_members (
  league_id  UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);

-- Tabla de resultados de partidos (por liga para mayor control)
CREATE TABLE IF NOT EXISTS match_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    INT NOT NULL,
  league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  goles_a     INT NOT NULL CHECK (goles_a >= 0),
  goles_b     INT NOT NULL CHECK (goles_b >= 0),
  estado      TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'finalizado')),
  updated_by  UUID NOT NULL REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, league_id)
);

-- Tabla de predicciones
CREATE TABLE IF NOT EXISTS predictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id         UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id          INT NOT NULL,
  goles_a           INT NOT NULL CHECK (goles_a >= 0),
  goles_b           INT NOT NULL CHECK (goles_b >= 0),
  puntos_obtenidos  INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, user_id, match_id)
);

-- Tabla de puntajes por liga (denormalizada para performance del leaderboard)
CREATE TABLE IF NOT EXISTS scores (
  league_id    UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total        INT NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);

-- ============================================================
-- Índices para queries frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id      ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at   ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_league_members_user   ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_league    ON predictions(league_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user      ON predictions(user_id, league_id);
CREATE INDEX IF NOT EXISTS idx_match_results_league  ON match_results(league_id);
CREATE INDEX IF NOT EXISTS idx_scores_league         ON scores(league_id, total DESC);

-- ============================================================
-- Row Level Security (RLS)
-- Las Edge Functions usan service_role, así que RLS es para
-- futuras integraciones directas desde el cliente.
-- ============================================================
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores         ENABLE ROW LEVEL SECURITY;

-- Las Edge Functions con service_role bypasean RLS automáticamente.
