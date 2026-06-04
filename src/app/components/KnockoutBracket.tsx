import { useState, useEffect } from 'react';
import { Trophy, Award, Loader2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { apiFetch } from '../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT FLUID BRACKET MATH
// To fit entirely on ONE screen without scrolling, we use fluid widths (grid-cols-9)
// and very compact heights.
// ─────────────────────────────────────────────────────────────────────────────
const SLOT = 72; // Very compact slot height
const TOTAL_H = SLOT * 8; // 576px - guaranteed to fit vertically without scroll

function isPlaceholder(t: string) { return /^[WL]\d|^[1-4]º/.test(t); }

interface MInfo { id: number; num: number; t1: string; t2: string; date: string; time: string; stadium: string; city: string; }

// Match Data
const R32_L: MInfo[] = [
  { id: 73, num: 73, t1: '2ºA', t2: '2ºB',      date: '28 Jun', time: '12:00', stadium: 'SoFi', city: 'LA' },
  { id: 74, num: 74, t1: '1ºE', t2: '3º A/B/C/D/F', date: '29 Jun', time: '16:30', stadium: 'Gillette', city: 'BOS' },
  { id: 75, num: 75, t1: '1ºF', t2: '2ºC',      date: '29 Jun', time: '19:00', stadium: 'BBVA', city: 'MTY' },
  { id: 76, num: 76, t1: '1ºC', t2: '2ºF',      date: '29 Jun', time: '12:00', stadium: 'NRG', city: 'HOU' },
  { id: 77, num: 77, t1: '1ºI', t2: '3º C/D/F/G/H', date: '30 Jun', time: '17:00', stadium: 'MetLife', city: 'NY' },
  { id: 78, num: 78, t1: '2ºE', t2: '2ºI',      date: '30 Jun', time: '12:00', stadium: 'AT&T', city: 'DAL' },
  { id: 79, num: 79, t1: '1ºA', t2: '3º C/E/F/H/I', date: '30 Jun', time: '19:00', stadium: 'Azteca', city: 'CDMX' },
  { id: 80, num: 80, t1: '1ºL', t2: '3º E/H/I/J/K', date: '1 Jul',  time: '12:00', stadium: 'Mercedes', city: 'ATL' },
];
const R32_R: MInfo[] = [
  { id: 81, num: 81, t1: '1ºD', t2: '3º B/E/F/I/J', date: '1 Jul',  time: '17:00', stadium: 'Levi\'s', city: 'SF' },
  { id: 82, num: 82, t1: '1ºG', t2: '3º A/E/H/I/J', date: '1 Jul',  time: '13:00', stadium: 'Lumen', city: 'SEA' },
  { id: 83, num: 83, t1: '2ºK', t2: '2ºL',      date: '2 Jul',  time: '19:00', stadium: 'BMO', city: 'TOR' },
  { id: 84, num: 84, t1: '1ºH', t2: '2ºJ',      date: '2 Jul',  time: '12:00', stadium: 'SoFi', city: 'LA' },
  { id: 85, num: 85, t1: '1ºB', t2: '3º E/F/G/I/J', date: '2 Jul',  time: '20:00', stadium: 'BC Place', city: 'VAN' },
  { id: 86, num: 86, t1: '1ºJ', t2: '2ºH',      date: '3 Jul',  time: '18:00', stadium: 'Hard Rock', city: 'MIA' },
  { id: 87, num: 87, t1: '1ºK', t2: '3º D/E/I/J/L', date: '3 Jul',  time: '20:30', stadium: 'Arrowhead', city: 'KC' },
  { id: 88, num: 88, t1: '2ºD', t2: '2ºG',      date: '3 Jul',  time: '13:00', stadium: 'AT&T', city: 'DAL' },
];
const R16_L: MInfo[] = [
  { id: 89, num: 89, t1: 'W73', t2: 'W74', date: '4 Jul', time: '17:00', stadium: 'Lincoln', city: 'PHI' },
  { id: 90, num: 90, t1: 'W75', t2: 'W76', date: '4 Jul', time: '12:00', stadium: 'NRG', city: 'HOU' },
  { id: 91, num: 91, t1: 'W77', t2: 'W78', date: '5 Jul', time: '16:00', stadium: 'MetLife', city: 'NY' },
  { id: 92, num: 92, t1: 'W79', t2: 'W80', date: '5 Jul', time: '18:00', stadium: 'Azteca', city: 'CDMX' },
];
const R16_R: MInfo[] = [
  { id: 93, num: 93, t1: 'W83', t2: 'W84', date: '6 Jul', time: '14:00', stadium: 'AT&T', city: 'DAL' },
  { id: 94, num: 94, t1: 'W81', t2: 'W82', date: '6 Jul', time: '17:00', stadium: 'Lumen', city: 'SEA' },
  { id: 95, num: 95, t1: 'W86', t2: 'W88', date: '7 Jul', time: '12:00', stadium: 'Mercedes', city: 'ATL' },
  { id: 96, num: 96, t1: 'W85', t2: 'W87', date: '7 Jul', time: '13:00', stadium: 'BC Place', city: 'VAN' },
];
const QF_L: MInfo[] = [
  { id: 97, num: 97, t1: 'W89', t2: 'W90', date: '9 Jul',  time: '16:00', stadium: 'Gillette', city: 'BOS' },
  { id: 98, num: 98, t1: 'W91', t2: 'W92', date: '10 Jul', time: '12:00', stadium: 'SoFi', city: 'LA' },
];
const QF_R: MInfo[] = [
  { id: 99,  num: 99, t1: 'W93', t2: 'W94', date: '11 Jul', time: '17:00', stadium: 'Hard Rock', city: 'MIA' },
  { id: 100, num: 100, t1: 'W95', t2: 'W96', date: '11 Jul', time: '20:00', stadium: 'Arrowhead', city: 'KC' },
];
const SF_L: MInfo[] = [{ id: 101, num: 101, t1: 'W97', t2: 'W98', date: '14 Jul', time: '14:00', stadium: 'AT&T', city: 'DAL' }];
const SF_R: MInfo[] = [{ id: 102, num: 102, t1: 'W99', t2: 'W100', date: '15 Jul', time: '15:00', stadium: 'Mercedes', city: 'ATL' }];
const THIRD: MInfo = { id: 103, num: 103, t1: 'L101', t2: 'L102', date: '18 Jul', time: '17:00', stadium: 'Hard Rock', city: 'MIA' };
const FINAL: MInfo = { id: 104, num: 104, t1: 'W101', t2: 'W102', date: '19 Jul', time: '15:00', stadium: 'MetLife', city: 'NY' };

const PHASES = [
  { label: '16avos de Final', sub: '28 Jun – 3 Jul · 16 partidos', matches: [...R32_L, ...R32_R], open: true },
  { label: 'Octavos de Final', sub: '4 – 7 Jul · 8 partidos',     matches: [...R16_L, ...R16_R] },
  { label: 'Cuartos de Final', sub: '9 – 11 Jul · 4 partidos',    matches: [...QF_L, ...QF_R] },
  { label: 'Semifinales',      sub: '14 – 15 Jul · 2 partidos',   matches: [...SF_L, ...SF_R] },
  { label: 'Tercer Lugar',     sub: '18 Jul · Miami',             matches: [THIRD], isThird: true },
  { label: 'Gran Final',       sub: '19 Jul · Nueva York',        matches: [FINAL], isFinal: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// BracketMatch Component - Ultra Compact & Fluid
// ─────────────────────────────────────────────────────────────────────────────
function BracketMatch({ m, resolveTeam, isFinal, isThird }: {
  m: MInfo;
  resolveTeam: (id: number, s: 'team1' | 'team2', fb: string) => string;
  isFinal?: boolean;
  isThird?: boolean;
}) {
  const rt1 = resolveTeam(m.id, 'team1', m.t1);
  const rt2 = resolveTeam(m.id, 'team2', m.t2);
  const ph1 = isPlaceholder(rt1);
  const ph2 = isPlaceholder(rt2);

  const containerClass = isFinal
    ? "border-accent shadow-accent/20 border-2"
    : isThird
    ? "border-secondary/50 shadow-secondary/10 border-2"
    : "border-border shadow-sm border";

  const headerBgClass = isFinal
    ? "bg-accent text-accent-foreground"
    : isThird
    ? "bg-secondary/10 text-secondary"
    : "bg-muted/30 text-muted-foreground";

  return (
    <div className={`w-full rounded-md overflow-hidden bg-white ${containerClass}`}>
      {/* Header Info - One Line Compact */}
      <div className={`px-1.5 py-1 flex items-center justify-between ${headerBgClass}`}>
        <div className="flex items-center gap-1">
          {isFinal && <Trophy className="w-3 h-3 flex-shrink-0" />}
          {isThird && <Award className="w-3 h-3 flex-shrink-0" />}
          <span className="text-[8px] xl:text-[9px] font-bold">#{m.num}</span>
        </div>
        <span className="text-[7.5px] xl:text-[8px] font-medium truncate ml-1 opacity-90">
          {m.date} {m.time}
        </span>
      </div>

      {/* Teams */}
      <div className="p-1 xl:p-1.5 space-y-1">
        {[
          { team: rt1, ph: ph1 },
          { team: rt2, ph: ph2 },
        ].map((r, idx) => (
          <div key={idx} className="flex items-center gap-1 xl:gap-1.5">
            {!r.ph ? (
              <CountryFlag country={r.team} size="xs" />
            ) : (
              <div className="w-3 h-3 xl:w-4 xl:h-4 rounded-full bg-muted border border-border flex-shrink-0" />
            )}
            <span className={`text-[8px] xl:text-[9.5px] flex-1 truncate ${r.ph ? 'text-muted-foreground italic' : 'font-bold text-foreground'}`}>
              {r.team}
            </span>
            <div className="w-4 h-4 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] font-bold text-muted-foreground">-</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column Component
// ─────────────────────────────────────────────────────────────────────────────
function BracketCol({ matches, level, label, resolveTeam, isRightSide }: {
  matches: MInfo[]; level: number; label: string;
  resolveTeam: (id: number, s: 'team1' | 'team2', fb: string) => string;
  isRightSide?: boolean;
}) {
  const slotH = SLOT * Math.pow(2, level);

  let drawLeft = false;
  let drawRight = false;
  if (!isRightSide) {
    if (level > 0) drawLeft = true;
    if (level < 3) drawRight = true;
    if (level === 3) drawRight = true;
  } else {
    if (level > 0) drawRight = true;
    if (level < 3) drawLeft = true;
    if (level === 3) drawLeft = true;
  }

  return (
    <div className="flex flex-col h-full w-full relative z-10">
      <div className="h-8 flex flex-col items-center justify-end pb-1">
        <span className="text-[9px] xl:text-[10px] font-extrabold tracking-widest text-primary uppercase text-center">{label}</span>
      </div>
      {matches.map(m => (
        <div key={m.id} style={{ height: slotH }} className="flex items-center justify-center w-full relative group">
          {drawLeft && (
            <div className="absolute left-[-4px] w-1 xl:w-2 h-px bg-border/80 -z-10 group-hover:bg-primary/50" />
          )}
          {drawRight && (
            <div className="absolute right-[-4px] w-1 xl:w-2 h-px bg-border/80 -z-10 group-hover:bg-primary/50" />
          )}
          <BracketMatch m={m} resolveTeam={resolveTeam} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Accordion Component
// ─────────────────────────────────────────────────────────────────────────────
function MobileView({ resolveTeam }: { resolveTeam: (id: number, s: 'team1' | 'team2', fb: string) => string }) {
  const [open, setOpen] = useState<number[]>([0, 5]);
  const toggle = (i: number) => setOpen(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  return (
    <div className="space-y-3 px-4">
      {PHASES.map((ph, i) => (
        <div key={i} className={`rounded-2xl border-2 overflow-hidden ${ph.isFinal ? 'border-accent shadow-accent/10 shadow-lg' : ph.isThird ? 'border-secondary shadow-secondary/10 shadow-md' : 'border-border'}`}>
          <button
            onClick={() => toggle(i)}
            className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${ph.isFinal ? 'bg-accent/5 hover:bg-accent/10' : ph.isThird ? 'bg-secondary/5 hover:bg-secondary/10' : 'bg-muted hover:bg-muted/70'}`}
          >
            <div className="text-left">
              <div className={`font-bold text-base flex items-center gap-2 ${ph.isFinal ? 'text-accent' : ph.isThird ? 'text-secondary' : 'text-primary'}`}>
                {ph.isFinal && <Trophy className="w-5 h-5" />}
                {ph.isThird && <Award className="w-5 h-5" />}
                {ph.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{ph.sub}</div>
            </div>
            {open.includes(i) ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
          </button>
          {open.includes(i) && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
              {ph.matches.map(m => (
                <div key={m.id} className="flex justify-center w-full max-w-[240px] mx-auto">
                  <BracketMatch m={m} resolveTeam={resolveTeam} isFinal={ph.isFinal} isThird={ph.isThird} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Bracket Export
// ─────────────────────────────────────────────────────────────────────────────
export function KnockoutBracket({ leagueId }: { leagueId?: string }) {
  const [bracketLocked, setBracketLocked] = useState(false);
  const [knockoutTeams, setKnockoutTeams] = useState<Record<number, { team1: string; team2: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!leagueId) return;
    (async () => {
      setIsLoading(true);
      try {
        const pr = await apiFetch(`/bracket/phase?leagueId=${leagueId}`);
        if (pr.ok) {
          const phase = await pr.json();
          setBracketLocked(phase.bracketLocked);
          if (phase.bracketLocked) {
            const tr = await apiFetch(`/bracket/knockout-teams?leagueId=${leagueId}`);
            if (tr.ok) setKnockoutTeams((await tr.json()).teams ?? {});
          }
        }
      } catch { /* silent */ }
      setIsLoading(false);
    })();
  }, [leagueId]);

  const resolveTeam = (id: number, s: 'team1' | 'team2', fb: string) => knockoutTeams[id]?.[s] ?? fb;

  return (
    <div className="space-y-4 lg:space-y-6 w-full">
      {/* ── Header ── */}
      <div className="text-center px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-mundial mb-1">Fase Eliminatoria</h2>
        <p className="text-xs lg:text-sm font-medium text-muted-foreground">28 de Junio — 19 de Julio · 2026</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-bold">Cargando llaves...</span>
        </div>
      )}

      {/* ── Status Banner ── */}
      {!isLoading && leagueId && (
        <div className="px-4 flex justify-center">
          <div className={`max-w-xl w-full flex items-center gap-3 px-4 py-2 rounded-xl border ${bracketLocked ? 'bg-secondary/10 border-secondary/30' : 'bg-muted border-border'}`}>
            <Lock className={`w-4 h-4 flex-shrink-0 ${bracketLocked ? 'text-secondary' : 'text-muted-foreground'}`} />
            <div>
              <p className={`text-xs font-bold ${bracketLocked ? 'text-secondary' : 'text-foreground'}`}>
                {bracketLocked ? 'Bracket confirmado' : 'Bracket pendiente'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          DESKTOP BRACKET (≥1280px)
          - NO SCROLL: Uses fluid grid to fit perfectly on ONE screen
          ══════════════════════════════════════════════ */}
      <div className="hidden xl:block w-[100vw]" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
        <div className="w-full mx-auto px-2 xl:px-4 2xl:px-8 pb-8">
          
          {/* A pure CSS grid with 9 equal columns guarantees it never overflows the screen width */}
          <div className="grid grid-cols-9 gap-1 xl:gap-2 w-full relative">
            
            {/* Background horizontal lines to visually connect columns perfectly through the gaps */}
            <div className="absolute top-8 bottom-0 left-[11.11%] right-[11.11%] flex justify-between pointer-events-none -z-10 opacity-20">
              {[1,2,3,4,5,6,7].map(i => (
                 <div key={i} className="h-full border-l border-border" />
              ))}
            </div>

            {/* Col 1 */} <BracketCol matches={R32_L} level={0} label="16AVOS" resolveTeam={resolveTeam} />
            {/* Col 2 */} <BracketCol matches={R16_L} level={1} label="OCTAVOS" resolveTeam={resolveTeam} />
            {/* Col 3 */} <BracketCol matches={QF_L}  level={2} label="CUARTOS" resolveTeam={resolveTeam} />
            {/* Col 4 */} <BracketCol matches={SF_L}  level={3} label="SEMIS"   resolveTeam={resolveTeam} />

            {/* Col 5: CENTER: FINAL + 3RD PLACE */}
            <div className="flex flex-col items-center justify-center relative w-full h-full" style={{ height: TOTAL_H + 32 }}>
              <div className="absolute w-px bg-border/60 -z-10" style={{ top: TOTAL_H/2 - 120, bottom: TOTAL_H/2 - 80 }} />
              
              <div className="flex flex-col items-center justify-center h-full w-full pb-10">
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center gap-1 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[9px] xl:text-[10px] font-extrabold tracking-widest text-accent uppercase">Final</span>
                  </div>
                  <BracketMatch m={FINAL} resolveTeam={resolveTeam} isFinal />
                </div>
              </div>

              <div className="absolute bottom-4 flex flex-col items-center w-full">
                <div className="flex items-center gap-1 mb-1">
                  <Award className="w-3 h-3 text-secondary" />
                  <span className="text-[8px] xl:text-[9px] font-bold tracking-widest text-secondary uppercase">3er Lugar</span>
                </div>
                <BracketMatch m={THIRD} resolveTeam={resolveTeam} isThird />
              </div>
            </div>

            {/* Col 6 */} <BracketCol matches={SF_R}  level={3} label="SEMIS"   resolveTeam={resolveTeam} isRightSide />
            {/* Col 7 */} <BracketCol matches={QF_R}  level={2} label="CUARTOS" resolveTeam={resolveTeam} isRightSide />
            {/* Col 8 */} <BracketCol matches={R16_R} level={1} label="OCTAVOS" resolveTeam={resolveTeam} isRightSide />
            {/* Col 9 */} <BracketCol matches={R32_R} level={0} label="16AVOS"  resolveTeam={resolveTeam} isRightSide />

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE / TABLET (<1280px)
          ══════════════════════════════════════════════ */}
      <div className="xl:hidden w-full max-w-3xl mx-auto pb-8">
        <MobileView resolveTeam={resolveTeam} />
      </div>
    </div>
  );
}
