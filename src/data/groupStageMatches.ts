// Mundial 2026 - Fase de Grupos Completa
// 48 equipos, 12 grupos (A-L), 72 partidos totales
// Fuente oficial: worldcup.json/2026/worldcup.json
// Fechas: 11 Junio - 27 Junio 2026

export interface Match {
  id: number;
  equipo_a: string;
  equipo_b: string;
  fecha_hora: string;
  estadio: string;
  grupo: string;
  goles_a?: number | null;
  goles_b?: number | null;
  estado?: 'pendiente' | 'en_juego' | 'finalizado';
}

export const GROUP_STAGE_MATCHES: Match[] = [
  // ==================== GRUPO A ====================
  // México, Sudáfrica, Corea del Sur, República Checa
  // Jornada 1
  {
    id: 1,
    equipo_a: 'México',
    equipo_b: 'Sudáfrica',
    fecha_hora: '2026-06-11T13:00:00-06:00',
    estadio: 'Estadio Azteca, Ciudad de México',
    grupo: 'A',
    estado: 'pendiente'
  },
  {
    id: 2,
    equipo_a: 'Corea del Sur',
    equipo_b: 'República Checa',
    fecha_hora: '2026-06-11T14:00:00-06:00',
    estadio: 'Estadio Akron, Guadalajara',
    grupo: 'A',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 3,
    equipo_a: 'República Checa',
    equipo_b: 'Sudáfrica',
    fecha_hora: '2026-06-18T06:00:00-04:00',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    grupo: 'A',
    estado: 'pendiente'
  },
  {
    id: 4,
    equipo_a: 'México',
    equipo_b: 'Corea del Sur',
    fecha_hora: '2026-06-18T13:00:00-06:00',
    estadio: 'Estadio Akron, Guadalajara',
    grupo: 'A',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 5,
    equipo_a: 'República Checa',
    equipo_b: 'México',
    fecha_hora: '2026-06-24T13:00:00-06:00',
    estadio: 'Estadio Azteca, Ciudad de México',
    grupo: 'A',
    estado: 'pendiente'
  },
  {
    id: 6,
    equipo_a: 'Sudáfrica',
    equipo_b: 'Corea del Sur',
    fecha_hora: '2026-06-24T13:00:00-06:00',
    estadio: 'Estadio BBVA, Monterrey',
    grupo: 'A',
    estado: 'pendiente'
  },

  // ==================== GRUPO B ====================
  // Canadá, Bosnia & Herzegovina, Catar, Suiza
  // Jornada 1
  {
    id: 7,
    equipo_a: 'Canadá',
    equipo_b: 'Bosnia & Herzegovina',
    fecha_hora: '2026-06-12T09:00:00-04:00',
    estadio: 'BMO Field, Toronto',
    grupo: 'B',
    estado: 'pendiente'
  },
  {
    id: 8,
    equipo_a: 'Catar',
    equipo_b: 'Suiza',
    fecha_hora: '2026-06-13T06:00:00-07:00',
    estadio: "Levi's Stadium, San Francisco",
    grupo: 'B',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 9,
    equipo_a: 'Suiza',
    equipo_b: 'Bosnia & Herzegovina',
    fecha_hora: '2026-06-18T06:00:00-07:00',
    estadio: 'SoFi Stadium, Los Ángeles',
    grupo: 'B',
    estado: 'pendiente'
  },
  {
    id: 10,
    equipo_a: 'Canadá',
    equipo_b: 'Catar',
    fecha_hora: '2026-06-18T09:00:00-07:00',
    estadio: 'BC Place, Vancouver',
    grupo: 'B',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 11,
    equipo_a: 'Suiza',
    equipo_b: 'Canadá',
    fecha_hora: '2026-06-24T06:00:00-07:00',
    estadio: 'BC Place, Vancouver',
    grupo: 'B',
    estado: 'pendiente'
  },
  {
    id: 12,
    equipo_a: 'Bosnia & Herzegovina',
    equipo_b: 'Catar',
    fecha_hora: '2026-06-24T06:00:00-07:00',
    estadio: 'Lumen Field, Seattle',
    grupo: 'B',
    estado: 'pendiente'
  },

  // ==================== GRUPO C ====================
  // Brasil, Marruecos, Haití, Escocia
  // Jornada 1
  {
    id: 13,
    equipo_a: 'Brasil',
    equipo_b: 'Marruecos',
    fecha_hora: '2026-06-13T12:00:00-04:00',
    estadio: 'MetLife Stadium, Nueva York',
    grupo: 'C',
    estado: 'pendiente'
  },
  {
    id: 14,
    equipo_a: 'Haití',
    equipo_b: 'Escocia',
    fecha_hora: '2026-06-13T15:00:00-04:00',
    estadio: 'Gillette Stadium, Boston',
    grupo: 'C',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 15,
    equipo_a: 'Escocia',
    equipo_b: 'Marruecos',
    fecha_hora: '2026-06-19T12:00:00-04:00',
    estadio: 'Gillette Stadium, Boston',
    grupo: 'C',
    estado: 'pendiente'
  },
  {
    id: 16,
    equipo_a: 'Brasil',
    equipo_b: 'Haití',
    fecha_hora: '2026-06-19T14:30:00-04:00',
    estadio: 'Lincoln Financial Field, Filadelfia',
    grupo: 'C',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 17,
    equipo_a: 'Escocia',
    equipo_b: 'Brasil',
    fecha_hora: '2026-06-24T12:00:00-04:00',
    estadio: 'Hard Rock Stadium, Miami',
    grupo: 'C',
    estado: 'pendiente'
  },
  {
    id: 18,
    equipo_a: 'Marruecos',
    equipo_b: 'Haití',
    fecha_hora: '2026-06-24T12:00:00-04:00',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    grupo: 'C',
    estado: 'pendiente'
  },

  // ==================== GRUPO D ====================
  // USA, Paraguay, Australia, Turquía
  // Jornada 1
  {
    id: 19,
    equipo_a: 'USA',
    equipo_b: 'Paraguay',
    fecha_hora: '2026-06-12T12:00:00-07:00',
    estadio: 'SoFi Stadium, Los Ángeles',
    grupo: 'D',
    estado: 'pendiente'
  },
  {
    id: 20,
    equipo_a: 'Australia',
    equipo_b: 'Turquía',
    fecha_hora: '2026-06-13T15:00:00-07:00',
    estadio: 'BC Place, Vancouver',
    grupo: 'D',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 21,
    equipo_a: 'USA',
    equipo_b: 'Australia',
    fecha_hora: '2026-06-19T06:00:00-07:00',
    estadio: 'Lumen Field, Seattle',
    grupo: 'D',
    estado: 'pendiente'
  },
  {
    id: 22,
    equipo_a: 'Turquía',
    equipo_b: 'Paraguay',
    fecha_hora: '2026-06-19T14:00:00-07:00',
    estadio: "Levi's Stadium, San Francisco",
    grupo: 'D',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 23,
    equipo_a: 'Turquía',
    equipo_b: 'USA',
    fecha_hora: '2026-06-25T13:00:00-07:00',
    estadio: 'SoFi Stadium, Los Ángeles',
    grupo: 'D',
    estado: 'pendiente'
  },
  {
    id: 24,
    equipo_a: 'Paraguay',
    equipo_b: 'Australia',
    fecha_hora: '2026-06-25T13:00:00-07:00',
    estadio: "Levi's Stadium, San Francisco",
    grupo: 'D',
    estado: 'pendiente'
  },

  // ==================== GRUPO E ====================
  // Alemania, Curazao, Costa de Marfil, Ecuador
  // Jornada 1
  {
    id: 25,
    equipo_a: 'Alemania',
    equipo_b: 'Curazao',
    fecha_hora: '2026-06-14T06:00:00-05:00',
    estadio: 'NRG Stadium, Houston',
    grupo: 'E',
    estado: 'pendiente'
  },
  {
    id: 26,
    equipo_a: 'Costa de Marfil',
    equipo_b: 'Ecuador',
    fecha_hora: '2026-06-14T13:00:00-04:00',
    estadio: 'Lincoln Financial Field, Filadelfia',
    grupo: 'E',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 27,
    equipo_a: 'Alemania',
    equipo_b: 'Costa de Marfil',
    fecha_hora: '2026-06-20T10:00:00-04:00',
    estadio: 'BMO Field, Toronto',
    grupo: 'E',
    estado: 'pendiente'
  },
  {
    id: 28,
    equipo_a: 'Ecuador',
    equipo_b: 'Curazao',
    fecha_hora: '2026-06-20T13:00:00-05:00',
    estadio: 'Arrowhead Stadium, Kansas City',
    grupo: 'E',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 29,
    equipo_a: 'Curazao',
    equipo_b: 'Costa de Marfil',
    fecha_hora: '2026-06-25T10:00:00-04:00',
    estadio: 'Lincoln Financial Field, Filadelfia',
    grupo: 'E',
    estado: 'pendiente'
  },
  {
    id: 30,
    equipo_a: 'Ecuador',
    equipo_b: 'Alemania',
    fecha_hora: '2026-06-25T10:00:00-04:00',
    estadio: 'MetLife Stadium, Nueva York',
    grupo: 'E',
    estado: 'pendiente'
  },

  // ==================== GRUPO F ====================
  // Países Bajos, Japón, Suecia, Túnez
  // Jornada 1
  {
    id: 31,
    equipo_a: 'Países Bajos',
    equipo_b: 'Japón',
    fecha_hora: '2026-06-14T09:00:00-05:00',
    estadio: 'AT&T Stadium, Dallas',
    grupo: 'F',
    estado: 'pendiente'
  },
  {
    id: 32,
    equipo_a: 'Suecia',
    equipo_b: 'Túnez',
    fecha_hora: '2026-06-14T14:00:00-06:00',
    estadio: 'Estadio BBVA, Monterrey',
    grupo: 'F',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 33,
    equipo_a: 'Países Bajos',
    equipo_b: 'Suecia',
    fecha_hora: '2026-06-20T06:00:00-05:00',
    estadio: 'NRG Stadium, Houston',
    grupo: 'F',
    estado: 'pendiente'
  },
  {
    id: 34,
    equipo_a: 'Túnez',
    equipo_b: 'Japón',
    fecha_hora: '2026-06-20T16:00:00-06:00',
    estadio: 'Estadio BBVA, Monterrey',
    grupo: 'F',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 35,
    equipo_a: 'Japón',
    equipo_b: 'Suecia',
    fecha_hora: '2026-06-25T12:00:00-05:00',
    estadio: 'AT&T Stadium, Dallas',
    grupo: 'F',
    estado: 'pendiente'
  },
  {
    id: 36,
    equipo_a: 'Túnez',
    equipo_b: 'Países Bajos',
    fecha_hora: '2026-06-25T12:00:00-05:00',
    estadio: 'Arrowhead Stadium, Kansas City',
    grupo: 'F',
    estado: 'pendiente'
  },

  // ==================== GRUPO G ====================
  // Bélgica, Egipto, Irán, Nueva Zelanda
  // Jornada 1
  {
    id: 37,
    equipo_a: 'Bélgica',
    equipo_b: 'Egipto',
    fecha_hora: '2026-06-15T06:00:00-07:00',
    estadio: 'Lumen Field, Seattle',
    grupo: 'G',
    estado: 'pendiente'
  },
  {
    id: 38,
    equipo_a: 'Irán',
    equipo_b: 'Nueva Zelanda',
    fecha_hora: '2026-06-15T12:00:00-07:00',
    estadio: 'SoFi Stadium, Los Ángeles',
    grupo: 'G',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 39,
    equipo_a: 'Bélgica',
    equipo_b: 'Irán',
    fecha_hora: '2026-06-21T06:00:00-07:00',
    estadio: 'SoFi Stadium, Los Ángeles',
    grupo: 'G',
    estado: 'pendiente'
  },
  {
    id: 40,
    equipo_a: 'Nueva Zelanda',
    equipo_b: 'Egipto',
    fecha_hora: '2026-06-21T12:00:00-07:00',
    estadio: 'BC Place, Vancouver',
    grupo: 'G',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 41,
    equipo_a: 'Egipto',
    equipo_b: 'Irán',
    fecha_hora: '2026-06-26T14:00:00-07:00',
    estadio: 'Lumen Field, Seattle',
    grupo: 'G',
    estado: 'pendiente'
  },
  {
    id: 42,
    equipo_a: 'Nueva Zelanda',
    equipo_b: 'Bélgica',
    fecha_hora: '2026-06-26T14:00:00-07:00',
    estadio: 'BC Place, Vancouver',
    grupo: 'G',
    estado: 'pendiente'
  },

  // ==================== GRUPO H ====================
  // España, Cabo Verde, Arabia Saudita, Uruguay
  // Jornada 1
  {
    id: 43,
    equipo_a: 'España',
    equipo_b: 'Cabo Verde',
    fecha_hora: '2026-06-15T06:00:00-04:00',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    grupo: 'H',
    estado: 'pendiente'
  },
  {
    id: 44,
    equipo_a: 'Arabia Saudita',
    equipo_b: 'Uruguay',
    fecha_hora: '2026-06-15T12:00:00-04:00',
    estadio: 'Hard Rock Stadium, Miami',
    grupo: 'H',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 45,
    equipo_a: 'España',
    equipo_b: 'Arabia Saudita',
    fecha_hora: '2026-06-21T06:00:00-04:00',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    grupo: 'H',
    estado: 'pendiente'
  },
  {
    id: 46,
    equipo_a: 'Uruguay',
    equipo_b: 'Cabo Verde',
    fecha_hora: '2026-06-21T12:00:00-04:00',
    estadio: 'Hard Rock Stadium, Miami',
    grupo: 'H',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 47,
    equipo_a: 'Cabo Verde',
    equipo_b: 'Arabia Saudita',
    fecha_hora: '2026-06-26T13:00:00-05:00',
    estadio: 'NRG Stadium, Houston',
    grupo: 'H',
    estado: 'pendiente'
  },
  {
    id: 48,
    equipo_a: 'Uruguay',
    equipo_b: 'España',
    fecha_hora: '2026-06-26T12:00:00-06:00',
    estadio: 'Estadio Akron, Guadalajara',
    grupo: 'H',
    estado: 'pendiente'
  },

  // ==================== GRUPO I ====================
  // Francia, Senegal, Iraq, Noruega
  // Jornada 1
  {
    id: 49,
    equipo_a: 'Francia',
    equipo_b: 'Senegal',
    fecha_hora: '2026-06-16T09:00:00-04:00',
    estadio: 'MetLife Stadium, Nueva York',
    grupo: 'I',
    estado: 'pendiente'
  },
  {
    id: 50,
    equipo_a: 'Iraq',
    equipo_b: 'Noruega',
    fecha_hora: '2026-06-16T12:00:00-04:00',
    estadio: 'Gillette Stadium, Boston',
    grupo: 'I',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 51,
    equipo_a: 'Francia',
    equipo_b: 'Iraq',
    fecha_hora: '2026-06-22T11:00:00-04:00',
    estadio: 'Lincoln Financial Field, Filadelfia',
    grupo: 'I',
    estado: 'pendiente'
  },
  {
    id: 52,
    equipo_a: 'Noruega',
    equipo_b: 'Senegal',
    fecha_hora: '2026-06-22T14:00:00-04:00',
    estadio: 'MetLife Stadium, Nueva York',
    grupo: 'I',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 53,
    equipo_a: 'Noruega',
    equipo_b: 'Francia',
    fecha_hora: '2026-06-26T09:00:00-04:00',
    estadio: 'Gillette Stadium, Boston',
    grupo: 'I',
    estado: 'pendiente'
  },
  {
    id: 54,
    equipo_a: 'Senegal',
    equipo_b: 'Iraq',
    fecha_hora: '2026-06-26T09:00:00-04:00',
    estadio: 'BMO Field, Toronto',
    grupo: 'I',
    estado: 'pendiente'
  },

  // ==================== GRUPO J ====================
  // Argentina, Argelia, Austria, Jordania
  // Jornada 1
  {
    id: 55,
    equipo_a: 'Argentina',
    equipo_b: 'Argelia',
    fecha_hora: '2026-06-16T14:00:00-05:00',
    estadio: 'Arrowhead Stadium, Kansas City',
    grupo: 'J',
    estado: 'pendiente'
  },
  {
    id: 56,
    equipo_a: 'Austria',
    equipo_b: 'Jordania',
    fecha_hora: '2026-06-16T15:00:00-07:00',
    estadio: "Levi's Stadium, San Francisco",
    grupo: 'J',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 57,
    equipo_a: 'Argentina',
    equipo_b: 'Austria',
    fecha_hora: '2026-06-22T06:00:00-05:00',
    estadio: 'AT&T Stadium, Dallas',
    grupo: 'J',
    estado: 'pendiente'
  },
  {
    id: 58,
    equipo_a: 'Jordania',
    equipo_b: 'Argelia',
    fecha_hora: '2026-06-22T14:00:00-07:00',
    estadio: "Levi's Stadium, San Francisco",
    grupo: 'J',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 59,
    equipo_a: 'Argelia',
    equipo_b: 'Austria',
    fecha_hora: '2026-06-27T15:00:00-05:00',
    estadio: 'Arrowhead Stadium, Kansas City',
    grupo: 'J',
    estado: 'pendiente'
  },
  {
    id: 60,
    equipo_a: 'Jordania',
    equipo_b: 'Argentina',
    fecha_hora: '2026-06-27T15:00:00-05:00',
    estadio: 'AT&T Stadium, Dallas',
    grupo: 'J',
    estado: 'pendiente'
  },

  // ==================== GRUPO K ====================
  // Portugal, DR Congo, Uzbekistán, Colombia
  // Jornada 1
  {
    id: 61,
    equipo_a: 'Portugal',
    equipo_b: 'DR Congo',
    fecha_hora: '2026-06-17T06:00:00-05:00',
    estadio: 'NRG Stadium, Houston',
    grupo: 'K',
    estado: 'pendiente'
  },
  {
    id: 62,
    equipo_a: 'Uzbekistán',
    equipo_b: 'Colombia',
    fecha_hora: '2026-06-17T14:00:00-06:00',
    estadio: 'Estadio Azteca, Ciudad de México',
    grupo: 'K',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 63,
    equipo_a: 'Portugal',
    equipo_b: 'Uzbekistán',
    fecha_hora: '2026-06-23T06:00:00-05:00',
    estadio: 'NRG Stadium, Houston',
    grupo: 'K',
    estado: 'pendiente'
  },
  {
    id: 64,
    equipo_a: 'Colombia',
    equipo_b: 'DR Congo',
    fecha_hora: '2026-06-23T14:00:00-06:00',
    estadio: 'Estadio Akron, Guadalajara',
    grupo: 'K',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 65,
    equipo_a: 'Colombia',
    equipo_b: 'Portugal',
    fecha_hora: '2026-06-27T13:30:00-04:00',
    estadio: 'Hard Rock Stadium, Miami',
    grupo: 'K',
    estado: 'pendiente'
  },
  {
    id: 66,
    equipo_a: 'DR Congo',
    equipo_b: 'Uzbekistán',
    fecha_hora: '2026-06-27T13:30:00-04:00',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    grupo: 'K',
    estado: 'pendiente'
  },

  // ==================== GRUPO L ====================
  // Inglaterra, Croacia, Ghana, Panamá
  // Jornada 1
  {
    id: 67,
    equipo_a: 'Inglaterra',
    equipo_b: 'Croacia',
    fecha_hora: '2026-06-17T09:00:00-05:00',
    estadio: 'AT&T Stadium, Dallas',
    grupo: 'L',
    estado: 'pendiente'
  },
  {
    id: 68,
    equipo_a: 'Ghana',
    equipo_b: 'Panamá',
    fecha_hora: '2026-06-17T13:00:00-04:00',
    estadio: 'BMO Field, Toronto',
    grupo: 'L',
    estado: 'pendiente'
  },
  // Jornada 2
  {
    id: 69,
    equipo_a: 'Inglaterra',
    equipo_b: 'Ghana',
    fecha_hora: '2026-06-23T10:00:00-04:00',
    estadio: 'Gillette Stadium, Boston',
    grupo: 'L',
    estado: 'pendiente'
  },
  {
    id: 70,
    equipo_a: 'Panamá',
    equipo_b: 'Croacia',
    fecha_hora: '2026-06-23T13:00:00-04:00',
    estadio: 'BMO Field, Toronto',
    grupo: 'L',
    estado: 'pendiente'
  },
  // Jornada 3
  {
    id: 71,
    equipo_a: 'Panamá',
    equipo_b: 'Inglaterra',
    fecha_hora: '2026-06-27T11:00:00-04:00',
    estadio: 'MetLife Stadium, Nueva York',
    grupo: 'L',
    estado: 'pendiente'
  },
  {
    id: 72,
    equipo_a: 'Croacia',
    equipo_b: 'Ghana',
    fecha_hora: '2026-06-27T11:00:00-04:00',
    estadio: 'Lincoln Financial Field, Filadelfia',
    grupo: 'L',
    estado: 'pendiente'
  },
];
