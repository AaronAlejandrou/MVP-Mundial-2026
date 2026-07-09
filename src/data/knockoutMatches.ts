export interface MInfo {
  id: number;
  num: number;
  t1: string;
  t2: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
}

export const R32_L: MInfo[] = [
  { id: 74, num: 74, t1: '1ºE', t2: '3º A/B/C/D/F', date: '29 Jun', time: '15:30', stadium: 'Gillette', city: 'BOS' },
  { id: 77, num: 77, t1: '1ºI', t2: '3º C/D/F/G/H', date: '30 Jun', time: '16:00', stadium: 'MetLife', city: 'NY' },
  { id: 73, num: 73, t1: '2ºA', t2: '2ºB',      date: '28 Jun', time: '14:00', stadium: 'SoFi', city: 'LA' },
  { id: 75, num: 75, t1: '1ºF', t2: '2ºC',      date: '29 Jun', time: '20:00', stadium: 'BBVA', city: 'MTY' },
  { id: 83, num: 83, t1: '2ºK', t2: '2ºL',      date: '2 Jul',  time: '18:00', stadium: 'BMO', city: 'TOR' },
  { id: 84, num: 84, t1: '1ºH', t2: '2ºJ',      date: '2 Jul',  time: '14:00', stadium: 'SoFi', city: 'LA' },
  { id: 81, num: 81, t1: '1ºD', t2: '3º B/E/F/I/J', date: '1 Jul',  time: '19:00', stadium: 'Levi\'s', city: 'SF' },
  { id: 82, num: 82, t1: '1ºG', t2: '3º A/E/H/I/J', date: '1 Jul',  time: '15:00', stadium: 'Lumen', city: 'SEA' },
];
export const R32_R: MInfo[] = [
  { id: 76, num: 76, t1: '1ºC', t2: '2ºF',      date: '29 Jun', time: '12:00', stadium: 'NRG', city: 'HOU' },
  { id: 78, num: 78, t1: '2ºE', t2: '2ºI',      date: '30 Jun', time: '12:00', stadium: 'AT&T', city: 'DAL' },
  { id: 79, num: 79, t1: '1ºA', t2: '3º C/E/F/H/I', date: '30 Jun', time: '20:00', stadium: 'Azteca', city: 'CDMX' },
  { id: 80, num: 80, t1: '1ºL', t2: '3º E/H/I/J/K', date: '1 Jul',  time: '11:00', stadium: 'Mercedes', city: 'ATL' },
  { id: 86, num: 86, t1: '1ºJ', t2: '2ºH',      date: '3 Jul',  time: '17:00', stadium: 'Hard Rock', city: 'MIA' },
  { id: 88, num: 88, t1: '2ºD', t2: '2ºG',      date: '3 Jul',  time: '13:00', stadium: 'AT&T', city: 'DAL' },
  { id: 85, num: 85, t1: '1ºB', t2: '3º E/F/G/I/J', date: '2 Jul',  time: '22:00', stadium: 'BC Place', city: 'VAN' },
  { id: 87, num: 87, t1: '1ºK', t2: '3º D/E/I/J/L', date: '3 Jul',  time: '20:30', stadium: 'Arrowhead', city: 'KC' },
];
export const R16_L: MInfo[] = [
  { id: 89, num: 89, t1: 'W74', t2: 'W77', date: '4 Jul', time: '16:00', stadium: 'Lincoln', city: 'PHI' },
  { id: 90, num: 90, t1: 'W73', t2: 'W75', date: '4 Jul', time: '12:00', stadium: 'NRG', city: 'HOU' },
  { id: 93, num: 93, t1: 'W83', t2: 'W84', date: '6 Jul', time: '14:00', stadium: 'AT&T', city: 'DAL' },
  { id: 94, num: 94, t1: 'W81', t2: 'W82', date: '6 Jul', time: '19:00', stadium: 'Lumen', city: 'SEA' },
];
export const R16_R: MInfo[] = [
  { id: 91, num: 91, t1: 'W76', t2: 'W78', date: '5 Jul', time: '15:00', stadium: 'MetLife', city: 'NY' },
  { id: 92, num: 92, t1: 'W79', t2: 'W80', date: '5 Jul', time: '19:00', stadium: 'Azteca', city: 'CDMX' },
  { id: 95, num: 95, t1: 'W86', t2: 'W88', date: '7 Jul', time: '11:00', stadium: 'Mercedes', city: 'ATL' },
  { id: 96, num: 96, t1: 'W85', t2: 'W87', date: '7 Jul', time: '15:00', stadium: 'BC Place', city: 'VAN' },
];
export const QF_L: MInfo[] = [
  { id: 97, num: 97, t1: 'W89', t2: 'W90', date: '9 Jul',  time: '15:00', stadium: 'Gillette', city: 'BOS' },
  { id: 98, num: 98, t1: 'W93', t2: 'W94', date: '10 Jul', time: '14:00', stadium: 'SoFi', city: 'LA' },
];
export const QF_R: MInfo[] = [
  { id: 99,  num: 99, t1: 'W91', t2: 'W92', date: '11 Jul', time: '16:00', stadium: 'Hard Rock', city: 'MIA' },
  { id: 100, num: 100, t1: 'W95', t2: 'W96', date: '11 Jul', time: '20:00', stadium: 'Arrowhead', city: 'KC' },
];
export const SF_L: MInfo[] = [{ id: 101, num: 101, t1: 'W97', t2: 'W98', date: '14 Jul', time: '14:00', stadium: 'AT&T', city: 'DAL' }];
export const SF_R: MInfo[] = [{ id: 102, num: 102, t1: 'W99', t2: 'W100', date: '15 Jul', time: '15:00', stadium: 'Mercedes', city: 'ATL' }];
export const THIRD: MInfo = { id: 103, num: 103, t1: 'L101', t2: 'L102', date: '18 Jul', time: '17:00', stadium: 'Hard Rock', city: 'MIA' };
export const FINAL: MInfo = { id: 104, num: 104, t1: 'W101', t2: 'W102', date: '19 Jul', time: '15:00', stadium: 'MetLife', city: 'NY' };

export const PHASES = [
  { label: '16avos de Final', sub: '28 Jun – 3 Jul · 16 partidos', matches: [...R32_L, ...R32_R], open: true },
  { label: 'Octavos de Final', sub: '4 – 7 Jul · 8 partidos',     matches: [...R16_L, ...R16_R] },
  { label: 'Cuartos de Final', sub: '9 – 11 Jul · 4 partidos',    matches: [...QF_L, ...QF_R] },
  { label: 'Semifinales',      sub: '14 – 15 Jul · 2 partidos',   matches: [...SF_L, ...SF_R] },
  { label: 'Tercer Lugar',     sub: '18 Jul · Miami',             matches: [THIRD], isThird: true },
  { label: 'Gran Final',       sub: '19 Jul · Nueva York',        matches: [FINAL], isFinal: true },
];

const parseDateString = (dayMonth: string, time: string) => {
  const parts = dayMonth.split(' ');
  const day = parts[0].padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = String(monthNames.indexOf(parts[1]) + 1).padStart(2, '0');
  return `2026-${month}-${day}T${time}:00-05:00`;
};

export const getResolvedKnockoutMatches = (knockoutTeams: Record<number, { team1: string; team2: string }>) => {
  const allMInfos = [
    ...R32_L, ...R32_R, ...R16_L, ...R16_R, ...QF_L, ...QF_R, ...SF_L, ...SF_R, THIRD, FINAL
  ];

  return allMInfos.map((m) => {
    const t1Resolved = knockoutTeams[m.id]?.team1 ?? m.t1;
    const t2Resolved = knockoutTeams[m.id]?.team2 ?? m.t2;

    let group = 'Eliminatorias';
    if (m.id <= 88) group = '16avos de Final';
    else if (m.id <= 96) group = 'Octavos de Final';
    else if (m.id <= 100) group = 'Cuartos de Final';
    else if (m.id <= 102) group = 'Semifinales';
    else if (m.id === 103) group = 'Tercer Lugar';
    else if (m.id === 104) group = 'Gran Final';

    return {
      id: m.id,
      equipo_a: t1Resolved,
      equipo_b: t2Resolved,
      fecha_hora: parseDateString(m.date, m.time),
      estadio: `${m.stadium}, ${m.city}`,
      grupo: group,
      estado: 'pendiente' as const
    };
  });
};
