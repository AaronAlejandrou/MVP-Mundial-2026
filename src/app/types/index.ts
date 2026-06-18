// ============================================
// TIPOS Y INTERFACES COMPARTIDAS
// Quiniela Mundial 2026
// ============================================

export interface Match {
  id: number;
  equipo_a: string;
  equipo_b: string;
  fecha_hora: string; // ISO 8601 UTC
  estadio: string;
  grupo: string;
  goles_a?: number | null;
  goles_b?: number | null;
  estado?: 'pendiente' | 'en_curso' | 'finalizado';
  api_status?: string | null;
  minuto?: string | null;
}

export interface Prediction {
  id?: string;
  user_id?: string;
  match_id?: number;
  goles_a: number;
  goles_b: number;
  puntos_obtenidos?: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  nombre: string;
  avatar_url?: string;
  created_at?: string;
}

export interface League {
  id: string;
  nombre: string;
  codigo_invitacion: string;
  admin_id: string;
  member_count?: number;
  created_at?: string;
}

export interface LeaguePlayer extends User {
  puntaje_total: number;
  posicion_anterior?: number;
  joined_at?: string;
}

export interface LeagueMember {
  user_id: string;
  league_id: string;
  puntaje_total: number;
  joined_at?: string;
}

// ============================================
// SISTEMA DE PUNTOS
// ============================================

/**
 * Calcula los puntos obtenidos según las reglas de la quiniela
 * @param prediction - Pronóstico del usuario
 * @param result - Resultado real del partido
 * @returns Puntos obtenidos (0-5)
 */
export function calculatePoints(
  prediction: { goles_a: number; goles_b: number },
  result: { goles_a: number; goles_b: number }
): number {
  const { goles_a: pA, goles_b: pB } = prediction;
  const { goles_a: rA, goles_b: rB } = result;

  // Determinar ganador del pronóstico
  const pWinner = pA > pB ? 'A' : pA < pB ? 'B' : 'E';
  // Determinar ganador del resultado real
  const rWinner = rA > rB ? 'A' : rA < rB ? 'B' : 'E';

  // 5 puntos: Resultado exacto
  if (pA === rA && pB === rB) {
    return 5;
  }

  // 4 puntos: Acierta ganador + goles exactos de 1 equipo
  if (pWinner === rWinner && pWinner !== 'E') {
    if ((pA === rA && pB !== rB) || (pA !== rA && pB === rB)) {
      return 4;
    }
  }

  // 2 puntos: Acierta ganador o empate con marcador distinto
  if (pWinner === rWinner) {
    return 2;
  }

  // 2 puntos: Acierta goles de 1 equipo sin acertar ganador
  if (pA === rA || pB === rB) {
    return 2;
  }

  // 0 puntos: Todo incorrecto
  return 0;
}

// ============================================
// UTILIDADES DE ZONA HORARIA
// ============================================

/**
 * Convierte una fecha UTC a hora local del usuario
 * (El navegador manejará automáticamente la conversión)
 */
export function formatMatchTime(utcDateString: string): Date {
  return new Date(utcDateString);
}

/**
 * Calcula minutos hasta un partido
 * @param matchDate - Fecha del partido
 * @returns Minutos restantes (negativo si ya pasó)
 */
export function getMinutesUntilMatch(matchDate: Date | string): number {
  const date = typeof matchDate === 'string' ? new Date(matchDate) : matchDate;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Verifica si un partido está bloqueado según la Regla T-30
 * @param matchDate - Fecha del partido
 * @param matchStatus - Estado actual del partido
 * @returns true si está bloqueado
 */
export function isMatchLocked(
  matchDate: Date | string,
  matchStatus: string = 'pendiente'
): boolean {
  if (matchStatus !== 'pendiente') return true;
  const minutesUntil = getMinutesUntilMatch(matchDate);
  return minutesUntil <= 30;
}

// ============================================
// GENERACIÓN DE CÓDIGOS
// ============================================

/**
 * Genera un código de invitación de liga
 * Formato: MUND-XXXX
 */
export function generateLeagueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MUND-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Valida formato de código de liga
 */
export function isValidLeagueCode(code: string): boolean {
  return /^MUND-[A-Z0-9]{4}$/i.test(code);
}

// ============================================
// TIPOS DE VISTAS
// ============================================

export type ViewType = 'matches' | 'leaderboard' | 'leagues';

export type MatchStatus = 'pendiente' | 'en_curso' | 'finalizado';
