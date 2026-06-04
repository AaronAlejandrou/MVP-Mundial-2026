-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA QUINIELA MUNDIAL 2026
-- Backend: Supabase (PostgreSQL)
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users
-- Almacena información de los usuarios
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: leagues
-- Almacena las ligas privadas
-- ============================================
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    codigo_invitacion VARCHAR(20) UNIQUE NOT NULL,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por código de invitación
CREATE INDEX idx_leagues_codigo ON leagues(codigo_invitacion);

-- ============================================
-- TABLA: league_members
-- Relación muchos a muchos entre usuarios y ligas
-- ============================================
CREATE TABLE league_members (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    puntaje_total INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, league_id)
);

-- Índice para consultas de leaderboard
CREATE INDEX idx_league_members_league ON league_members(league_id, puntaje_total DESC);

-- ============================================
-- TABLA: matches
-- Almacena todos los partidos del Mundial
-- ============================================
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    equipo_a VARCHAR(50) NOT NULL,
    equipo_b VARCHAR(50) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL,
    estadio VARCHAR(100),
    grupo VARCHAR(10),
    goles_a INTEGER,
    goles_b INTEGER,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_juego', 'finalizado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por fecha y estado
CREATE INDEX idx_matches_fecha ON matches(fecha_hora);
CREATE INDEX idx_matches_estado ON matches(estado);

-- ============================================
-- TABLA: predictions
-- Almacena los pronósticos de cada usuario para cada partido
-- ============================================
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    goles_a INTEGER NOT NULL CHECK (goles_a >= 0),
    goles_b INTEGER NOT NULL CHECK (goles_b >= 0),
    puntos_obtenidos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

-- Índice para consultas de predicciones por usuario y partido
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);

-- ============================================
-- FUNCIÓN: Calcular puntos según las reglas
-- Sistema de Puntos:
-- - 5 puntos: Resultado exacto
-- - 4 puntos: Acierta ganador + goles exactos de 1 equipo
-- - 2 puntos: Acierta ganador o empate con marcador distinto
-- - 2 puntos: Acierta goles de 1 equipo sin acertar ganador
-- - 0 puntos: Todo incorrecto
-- ============================================
CREATE OR REPLACE FUNCTION calculate_prediction_points(
    p_goles_a INTEGER,
    p_goles_b INTEGER,
    r_goles_a INTEGER,
    r_goles_b INTEGER
) RETURNS INTEGER AS $$
DECLARE
    points INTEGER := 0;
    p_winner VARCHAR(1);
    r_winner VARCHAR(1);
BEGIN
    -- Determinar ganador del pronóstico
    IF p_goles_a > p_goles_b THEN
        p_winner := 'A';
    ELSIF p_goles_a < p_goles_b THEN
        p_winner := 'B';
    ELSE
        p_winner := 'E'; -- Empate
    END IF;

    -- Determinar ganador del resultado real
    IF r_goles_a > r_goles_b THEN
        r_winner := 'A';
    ELSIF r_goles_a < r_goles_b THEN
        r_winner := 'B';
    ELSE
        r_winner := 'E'; -- Empate
    END IF;

    -- Resultado exacto (5 puntos)
    IF p_goles_a = r_goles_a AND p_goles_b = r_goles_b THEN
        RETURN 5;
    END IF;

    -- Acierta ganador + goles exactos de 1 equipo (4 puntos)
    IF p_winner = r_winner AND p_winner != 'E' THEN
        IF (p_goles_a = r_goles_a AND p_goles_b != r_goles_b) OR
           (p_goles_a != r_goles_a AND p_goles_b = r_goles_b) THEN
            RETURN 4;
        END IF;
    END IF;

    -- Acierta ganador o empate con marcador distinto (2 puntos)
    IF p_winner = r_winner THEN
        RETURN 2;
    END IF;

    -- Acierta goles de 1 equipo sin acertar ganador (2 puntos)
    IF p_goles_a = r_goles_a OR p_goles_b = r_goles_b THEN
        RETURN 2;
    END IF;

    -- Todo incorrecto (0 puntos)
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Actualizar puntos cuando finaliza un partido
-- ============================================
CREATE OR REPLACE FUNCTION update_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el partido está finalizado y tiene resultados
    IF NEW.estado = 'finalizado' AND NEW.goles_a IS NOT NULL AND NEW.goles_b IS NOT NULL THEN
        -- Actualizar puntos de todas las predicciones para este partido
        UPDATE predictions
        SET puntos_obtenidos = calculate_prediction_points(
            goles_a,
            goles_b,
            NEW.goles_a,
            NEW.goles_b
        ),
        updated_at = NOW()
        WHERE match_id = NEW.id;

        -- Actualizar puntaje total en league_members
        UPDATE league_members lm
        SET puntaje_total = (
            SELECT COALESCE(SUM(p.puntos_obtenidos), 0)
            FROM predictions p
            WHERE p.user_id = lm.user_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_points
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (NEW.estado = 'finalizado')
EXECUTE FUNCTION update_prediction_points();

-- ============================================
-- TRIGGER: Actualizar timestamp de predictions
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_predictions_updated_at
BEFORE UPDATE ON predictions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Users: Los usuarios pueden ver y editar solo su propia información
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Leagues: Todos pueden ver ligas, solo el admin puede editarlas
CREATE POLICY "Anyone can view leagues"
    ON leagues FOR SELECT
    USING (true);

CREATE POLICY "Only admin can update league"
    ON leagues FOR UPDATE
    USING (auth.uid() = admin_id);

CREATE POLICY "Anyone can create leagues"
    ON leagues FOR INSERT
    WITH CHECK (true);

-- League Members: Los miembros pueden ver su liga
CREATE POLICY "Members can view their leagues"
    ON league_members FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM league_members lm
        WHERE lm.league_id = league_members.league_id
        AND lm.user_id = auth.uid()
    ));

CREATE POLICY "Users can join leagues"
    ON league_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Matches: Todos pueden ver los partidos
CREATE POLICY "Anyone can view matches"
    ON matches FOR SELECT
    USING (true);

-- Predictions: Los usuarios solo pueden ver y editar sus propias predicciones
CREATE POLICY "Users can view their own predictions"
    ON predictions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own predictions"
    ON predictions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own predictions"
    ON predictions FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCIÓN AUXILIAR: Generar código de invitación único
-- ============================================
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN := true;
BEGIN
    WHILE code_exists LOOP
        -- Generar código en formato MUND-XXXX
        new_code := 'MUND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

        -- Verificar si el código ya existe
        SELECT EXISTS(SELECT 1 FROM leagues WHERE codigo_invitacion = new_code) INTO code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERTAR DATOS SEMILLA (SEED DATA)
-- ============================================

-- Insertar los primeros 6 partidos del Mundial 2026
INSERT INTO matches (id, equipo_a, equipo_b, fecha_hora, estadio, grupo)
VALUES
    (1, 'México', 'Sudáfrica', '2026-06-11T19:00:00Z', 'Estadio Ciudad de México', 'A'),
    (2, 'República de Corea', 'República Checa', '2026-06-12T02:00:00Z', 'Estadio Guadalajara', 'A'),
    (3, 'Canadá', 'Bosnia', '2026-06-12T19:00:00Z', 'Toronto Stadium', 'B'),
    (4, 'Estados Unidos', 'Paraguay', '2026-06-13T01:00:00Z', 'Los Angeles Stadium', 'D'),
    (5, 'Australia', 'Turquía', '2026-06-13T04:00:00Z', 'BC Place Vancouver', 'D'),
    (6, 'Catar', 'Suiza', '2026-06-13T19:00:00Z', 'San Francisco Bay Area Stadium', 'B');

-- Resetear la secuencia para que continúe desde el ID 7
SELECT setval('matches_id_seq', 6, true);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Todas las fechas se almacenan en UTC (fecha_hora TIMESTAMPTZ)
-- 2. El frontend debe convertir a UTC-5 (America/Lima) para mostrar
-- 3. La Regla T-30 se implementa en el frontend (bloquear 30 min antes)
-- 4. Los puntos se calculan automáticamente cuando un partido finaliza
-- 5. El puntaje_total en league_members se actualiza automáticamente
