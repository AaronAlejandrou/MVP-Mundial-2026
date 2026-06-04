// Datos de tabla de posiciones - Fase de Grupos Mundial 2026
// Alineado con worldcup.json/2026/worldcup.teams.json
// 48 equipos, 12 grupos (A-L), 4 equipos por grupo

export interface TeamStanding {
  equipo: string;
  pj: number; // Partidos Jugados
  pg: number; // Partidos Ganados
  pe: number; // Partidos Empatados
  pp: number; // Partidos Perdidos
  gf: number; // Goles a Favor
  gc: number; // Goles en Contra
  dif: number; // Diferencia de Goles
  pts: number; // Puntos
}

export interface GroupStanding {
  grupo: string;
  equipos: TeamStanding[];
}

const emptyStats = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };

export const GROUP_STANDINGS: GroupStanding[] = [
  {
    grupo: 'A',
    equipos: [
      { equipo: 'México', ...emptyStats },
      { equipo: 'Sudáfrica', ...emptyStats },
      { equipo: 'Corea del Sur', ...emptyStats },
      { equipo: 'República Checa', ...emptyStats },
    ]
  },
  {
    grupo: 'B',
    equipos: [
      { equipo: 'Canadá', ...emptyStats },
      { equipo: 'Bosnia & Herzegovina', ...emptyStats },
      { equipo: 'Catar', ...emptyStats },
      { equipo: 'Suiza', ...emptyStats },
    ]
  },
  {
    grupo: 'C',
    equipos: [
      { equipo: 'Brasil', ...emptyStats },
      { equipo: 'Marruecos', ...emptyStats },
      { equipo: 'Haití', ...emptyStats },
      { equipo: 'Escocia', ...emptyStats },
    ]
  },
  {
    grupo: 'D',
    equipos: [
      { equipo: 'USA', ...emptyStats },
      { equipo: 'Paraguay', ...emptyStats },
      { equipo: 'Australia', ...emptyStats },
      { equipo: 'Turquía', ...emptyStats },
    ]
  },
  {
    grupo: 'E',
    equipos: [
      { equipo: 'Alemania', ...emptyStats },
      { equipo: 'Curazao', ...emptyStats },
      { equipo: 'Costa de Marfil', ...emptyStats },
      { equipo: 'Ecuador', ...emptyStats },
    ]
  },
  {
    grupo: 'F',
    equipos: [
      { equipo: 'Países Bajos', ...emptyStats },
      { equipo: 'Japón', ...emptyStats },
      { equipo: 'Suecia', ...emptyStats },
      { equipo: 'Túnez', ...emptyStats },
    ]
  },
  {
    grupo: 'G',
    equipos: [
      { equipo: 'Bélgica', ...emptyStats },
      { equipo: 'Egipto', ...emptyStats },
      { equipo: 'Irán', ...emptyStats },
      { equipo: 'Nueva Zelanda', ...emptyStats },
    ]
  },
  {
    grupo: 'H',
    equipos: [
      { equipo: 'España', ...emptyStats },
      { equipo: 'Cabo Verde', ...emptyStats },
      { equipo: 'Arabia Saudita', ...emptyStats },
      { equipo: 'Uruguay', ...emptyStats },
    ]
  },
  {
    grupo: 'I',
    equipos: [
      { equipo: 'Francia', ...emptyStats },
      { equipo: 'Senegal', ...emptyStats },
      { equipo: 'Iraq', ...emptyStats },
      { equipo: 'Noruega', ...emptyStats },
    ]
  },
  {
    grupo: 'J',
    equipos: [
      { equipo: 'Argentina', ...emptyStats },
      { equipo: 'Argelia', ...emptyStats },
      { equipo: 'Austria', ...emptyStats },
      { equipo: 'Jordania', ...emptyStats },
    ]
  },
  {
    grupo: 'K',
    equipos: [
      { equipo: 'Portugal', ...emptyStats },
      { equipo: 'DR Congo', ...emptyStats },
      { equipo: 'Uzbekistán', ...emptyStats },
      { equipo: 'Colombia', ...emptyStats },
    ]
  },
  {
    grupo: 'L',
    equipos: [
      { equipo: 'Inglaterra', ...emptyStats },
      { equipo: 'Croacia', ...emptyStats },
      { equipo: 'Ghana', ...emptyStats },
      { equipo: 'Panamá', ...emptyStats },
    ]
  },
];

// Datos mock de últimos partidos por equipo
export interface TeamMatch {
  equipo_a: string;
  equipo_b: string;
  goles_a: number;
  goles_b: number;
  fecha: string;
  grupo: string;
}

export const TEAM_RECENT_MATCHES: Record<string, TeamMatch[]> = {};
