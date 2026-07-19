// Paletas de confeti por selección (colores de la bandera). Fallback dorado
// para selecciones no mapeadas. Se usa en las celebraciones al pronosticar.
const TEAM_COLORS: Record<string, string[]> = {
  'España':        ['#C60B1E', '#FFC400', '#FFFFFF'],
  'Argentina':     ['#6CB7EC', '#75AADB', '#9BCDF3', '#FFFFFF'],
  'Francia':       ['#0055A4', '#FFFFFF', '#EF4135'],
  'Brasil':        ['#009B3A', '#FEDF00', '#002776'],
  'Inglaterra':    ['#FFFFFF', '#CF081F'],
  'Alemania':      ['#111111', '#DD0000', '#FFCE00'],
  'Portugal':      ['#046A38', '#DA291C', '#FFE000'],
  'Países Bajos':  ['#AE1C28', '#FF7900', '#21468B'],
  'Uruguay':       ['#5CBFEB', '#FFFFFF', '#FCD116'],
  'México':        ['#006847', '#FFFFFF', '#CE1126'],
  'USA':           ['#3C3B6E', '#B22234', '#FFFFFF'],
  'Croacia':       ['#FF0000', '#FFFFFF', '#171796'],
  'Marruecos':     ['#C1272D', '#006233', '#FFFFFF'],
  'Colombia':      ['#FCD116', '#003893', '#CE1126'],
  'Japón':         ['#BC002D', '#FFFFFF'],
  'Bélgica':       ['#111111', '#FDDA24', '#EF3340'],
};

const FALLBACK = ['#F1D07C', '#EAC65E', '#FFFFFF'];

/** Colores de celebración para una selección (o el dorado por defecto). */
export function teamColors(country?: string | null): string[] {
  if (country && TEAM_COLORS[country]) return TEAM_COLORS[country];
  return FALLBACK;
}
