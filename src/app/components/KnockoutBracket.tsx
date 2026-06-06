import { useState, useEffect } from 'react';
import { Trophy, Award, Loader2, Lock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { apiFetch } from '../../lib/api';
import { MatchCard } from './MatchCard';
import { PHASES, R32_L, R32_R, R16_L, R16_R, QF_L, QF_R, SF_L, SF_R, THIRD, FINAL, MInfo, getResolvedKnockoutMatches } from '../../data/knockoutMatches';

const SLOT = 72;
const TOTAL_H = SLOT * 8;

function isPlaceholder(t: string) { return /^[WL]\d|^[1-4]º/.test(t); }

function BracketMatch({ m, resolveTeam, isFinal, isThird, onClick, result, prediction }: {
  m: MInfo;
  resolveTeam: (id: number, s: 'team1' | 'team2', fb: string) => string;
  isFinal?: boolean;
  isThird?: boolean;
  onClick?: (m: MInfo) => void;
  result?: any;
  prediction?: any;
}) {
  const rt1 = resolveTeam(m.id, 'team1', m.t1);
  const rt2 = resolveTeam(m.id, 'team2', m.t2);
  const ph1 = isPlaceholder(rt1);
  const ph2 = isPlaceholder(rt2);

  const containerClass = isFinal
    ? "border-accent shadow-accent/20 border-2"
    : isThird
    ? "border-secondary/50 shadow-secondary/10 border-2"
    : "border-border shadow-sm border relative overflow-hidden";

  const headerBgClass = isFinal
    ? "bg-accent text-accent-foreground"
    : isThird
    ? "bg-secondary/10 text-secondary"
    : "bg-muted/30 text-muted-foreground";

  const isFinished = result && result.estado === 'finalizado';
  
  return (
    <div 
      onClick={() => onClick && onClick(m)}
      className={`w-full rounded-md bg-card ${containerClass} ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
    >
      <div className={`px-1.5 py-1 flex items-center justify-between ${headerBgClass}`}>
        <div className="flex items-center gap-1">
          {isFinal && <Trophy className="w-3 h-3 flex-shrink-0" />}
          {isThird && <Award className="w-3 h-3 flex-shrink-0" />}
          <span className="text-[8px] xl:text-[9px] font-bold">#{m.num}</span>
        </div>
        <div className="flex items-center gap-1">
          {prediction?.puntos_obtenidos !== undefined && isFinished && (
            <span className={`text-[8px] font-bold px-1 rounded-sm ${prediction.puntos_obtenidos === 5 ? 'bg-accent/20 text-accent' : prediction.puntos_obtenidos > 0 ? 'bg-secondary/20 text-secondary' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
              +{prediction.puntos_obtenidos}
            </span>
          )}
          <span className="text-[7.5px] xl:text-[8px] font-medium truncate opacity-90">
            {m.date}
          </span>
        </div>
      </div>
      <div className="p-1 xl:p-1.5 space-y-1 relative">
        {[
          { team: rt1, ph: ph1, rG: result?.golesA, pG: prediction?.goles_a },
          { team: rt2, ph: ph2, rG: result?.golesB, pG: prediction?.goles_b },
        ].map((r, idx) => (
          <div key={idx} className="flex items-center gap-1 xl:gap-1.5 h-[18px]">
            {!r.ph ? (
              <CountryFlag country={r.team} size="xs" />
            ) : (
              <div className="w-3 h-3 xl:w-4 xl:h-4 rounded-full bg-muted border border-border flex-shrink-0" />
            )}
            <span className={`text-[8px] xl:text-[9.5px] flex-1 truncate ${r.ph ? 'text-muted-foreground italic' : 'font-bold text-foreground'}`}>
              {r.team}
            </span>
            
            {/* Contenedor de scores */}
            <div className="flex items-center gap-0.5 justify-end w-12 flex-shrink-0">
              {/* Pronostico (subliminal) */}
              {r.pG !== undefined && (
                <span className={`text-[7px] font-bold w-4 text-center ${isFinished ? 'text-primary/40' : 'text-primary'}`}>
                  {r.pG}
                </span>
              )}
              {/* Resultado real */}
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isFinished ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
                <span className="text-[8px] font-bold">
                  {isFinished ? r.rG : '-'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketCol({ matches, level, label, resolveTeam, isRightSide, onMatchClick, predictions, matchResults }: {
  matches: MInfo[]; level: number; label: string;
  resolveTeam: (id: number, s: 'team1' | 'team2', fb: string) => string;
  isRightSide?: boolean;
  onMatchClick?: (m: MInfo) => void;
  predictions?: Record<number, any>;
  matchResults?: Record<number, any>;
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
          {drawLeft && <div className="absolute left-[-4px] w-1 xl:w-2 h-px bg-border/80 -z-10 group-hover:bg-primary/50" />}
          {drawRight && <div className="absolute right-[-4px] w-1 xl:w-2 h-px bg-border/80 -z-10 group-hover:bg-primary/50" />}
          <BracketMatch m={m} resolveTeam={resolveTeam} onClick={onMatchClick} result={matchResults?.[m.id]} prediction={predictions?.[m.id]} />
        </div>
      ))}
    </div>
  );
}

function MobileView({ resolveTeam, onMatchClick, predictions, matchResults }: { 
  resolveTeam: (id: number, s: 'team1' | 'team2', fb: string) => string;
  onMatchClick?: (m: MInfo) => void;
  predictions?: Record<number, any>;
  matchResults?: Record<number, any>;
}) {
  const [open, setOpen] = useState<number[]>([0, 5]);
  const toggle = (i: number) => setOpen(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  return (
    <div className="space-y-3 px-4">
      {PHASES.map((ph, i) => (
        <div key={i} className={`rounded-2xl border-2 overflow-hidden ${ph.isFinal ? 'border-accent shadow-accent/10 shadow-lg' : ph.isThird ? 'border-secondary shadow-secondary/10 shadow-md' : 'border-border'}`}>
          <button onClick={() => toggle(i)} className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${ph.isFinal ? 'bg-accent/5 hover:bg-accent/10' : ph.isThird ? 'bg-secondary/5 hover:bg-secondary/10' : 'bg-muted hover:bg-muted/70'}`}>
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
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card">
              {ph.matches.map(m => (
                <div key={m.id} className="flex justify-center w-full max-w-[240px] mx-auto">
                  <BracketMatch m={m} resolveTeam={resolveTeam} isFinal={ph.isFinal} isThird={ph.isThird} onClick={onMatchClick} result={matchResults?.[m.id]} prediction={predictions?.[m.id]} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function KnockoutBracket({ 
  leagueId,
  predictions,
  matchResults,
  onSavePrediction 
}: { 
  leagueId?: string;
  predictions?: Record<number, any>;
  matchResults?: Record<number, any>;
  onSavePrediction?: (matchId: number, golesA: number, golesB: number) => Promise<void>;
}) {
  const [bracketLocked, setBracketLocked] = useState(false);
  const [knockoutTeams, setKnockoutTeams] = useState<Record<number, { team1: string; team2: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state
  const [selectedMatchInfo, setSelectedMatchInfo] = useState<MInfo | null>(null);

  useEffect(() => {
    if (!leagueId) return;
    (async () => {
      setIsLoading(true);
      try {
        const pr = await apiFetch(`/bracket/phase?leagueId=${leagueId}`);
        if (pr.ok) {
          const phase = await pr.json();
          // Ahora leemos a partir del historial parcial si confirmGroups tiene avance
          setBracketLocked(phase.bracketLocked || phase.confirmedGroups?.length > 0);
          const tr = await apiFetch(`/bracket/knockout-teams?leagueId=${leagueId}`);
          if (tr.ok) setKnockoutTeams((await tr.json()).teams ?? {});
        }
      } catch { /* silent */ }
      setIsLoading(false);
    })();
  }, [leagueId]);

  const resolveTeam = (id: number, s: 'team1' | 'team2', fb: string) => knockoutTeams[id]?.[s] ?? fb;

  const handleMatchClick = (m: MInfo) => {
    // Only allow clicking if teams are resolved
    const t1 = resolveTeam(m.id, 'team1', m.t1);
    const t2 = resolveTeam(m.id, 'team2', m.t2);
    if (isPlaceholder(t1) || isPlaceholder(t2)) return;
    setSelectedMatchInfo(m);
  };

  const getFullMatchFromMInfo = (m: MInfo) => {
    return getResolvedKnockoutMatches(knockoutTeams).find(x => x.id === m.id);
  };

  const selectedFullMatch = selectedMatchInfo ? getFullMatchFromMInfo(selectedMatchInfo) : null;
  // Mix real result into the full match for the modal
  const enrichedSelectedMatch = selectedFullMatch ? {
    ...selectedFullMatch,
    goles_a: matchResults?.[selectedFullMatch.id]?.golesA ?? null,
    goles_b: matchResults?.[selectedFullMatch.id]?.golesB ?? null,
    estado: matchResults?.[selectedFullMatch.id]?.estado ?? 'pendiente',
  } : null;

  return (
    <div className="space-y-4 lg:space-y-6 w-full relative">
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

      {!isLoading && leagueId && (
        <div className="px-4 flex justify-center">
          <div className="max-w-xl w-full flex items-center gap-3 px-4 py-2 rounded-xl border bg-secondary/10 border-secondary/30">
            <Lock className="w-4 h-4 flex-shrink-0 text-secondary" />
            <div>
              <p className="text-xs font-bold text-secondary">
                ¡Haz clic en los partidos con equipos confirmados para pronosticar!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="hidden xl:block w-[100vw]" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
        <div className="w-full mx-auto px-2 xl:px-4 2xl:px-8 pb-8">
          <div className="grid grid-cols-9 gap-1 xl:gap-2 w-full relative">
            <div className="absolute top-8 bottom-0 left-[11.11%] right-[11.11%] flex justify-between pointer-events-none -z-10 opacity-20">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-full border-l border-border" />)}
            </div>

            {/* Col 1 */} <BracketCol matches={R32_L} level={0} label="16AVOS" resolveTeam={resolveTeam} onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
            {/* Col 2 */} <BracketCol matches={R16_L} level={1} label="OCTAVOS" resolveTeam={resolveTeam} onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
            {/* Col 3 */} <BracketCol matches={QF_L}  level={2} label="CUARTOS" resolveTeam={resolveTeam} onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
            {/* Col 4 */} <BracketCol matches={SF_L}  level={3} label="SEMIS"   resolveTeam={resolveTeam} onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />

            {/* Col 5: CENTER */}
            <div className="flex flex-col items-center justify-center relative w-full h-full" style={{ height: TOTAL_H + 32 }}>
              <div className="absolute w-px bg-border/60 -z-10" style={{ top: TOTAL_H/2 - 120, bottom: TOTAL_H/2 - 80 }} />
              
              <div className="flex flex-col items-center justify-center h-full w-full pb-10">
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center gap-1 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[9px] xl:text-[10px] font-extrabold tracking-widest text-accent uppercase">Final</span>
                  </div>
                  <BracketMatch m={FINAL} resolveTeam={resolveTeam} isFinal onClick={handleMatchClick} result={matchResults?.[FINAL.id]} prediction={predictions?.[FINAL.id]} />
                </div>
              </div>

              <div className="absolute bottom-4 flex flex-col items-center w-full">
                <div className="flex items-center gap-1 mb-1">
                  <Award className="w-3 h-3 text-secondary" />
                  <span className="text-[8px] xl:text-[9px] font-bold tracking-widest text-secondary uppercase">3er Lugar</span>
                </div>
                <BracketMatch m={THIRD} resolveTeam={resolveTeam} isThird onClick={handleMatchClick} result={matchResults?.[THIRD.id]} prediction={predictions?.[THIRD.id]} />
              </div>
            </div>

            {/* Col 6 */} <BracketCol matches={SF_R}  level={3} label="SEMIS"   resolveTeam={resolveTeam} isRightSide onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
            {/* Col 7 */} <BracketCol matches={QF_R}  level={2} label="CUARTOS" resolveTeam={resolveTeam} isRightSide onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
            {/* Col 8 */} <BracketCol matches={R16_R} level={1} label="OCTAVOS" resolveTeam={resolveTeam} isRightSide onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
            {/* Col 9 */} <BracketCol matches={R32_R} level={0} label="16AVOS"  resolveTeam={resolveTeam} isRightSide onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
          </div>
        </div>
      </div>

      <div className="xl:hidden w-full max-w-3xl mx-auto pb-8">
        <MobileView resolveTeam={resolveTeam} onMatchClick={handleMatchClick} predictions={predictions} matchResults={matchResults} />
      </div>

      {/* Prediction Modal */}
      {selectedMatchInfo && enrichedSelectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
            <button 
              onClick={() => setSelectedMatchInfo(null)}
              className="absolute top-4 right-4 p-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 pt-10">
              <h3 className="text-xl font-bold text-center mb-6 text-foreground">
                Pronosticar {enrichedSelectedMatch.grupo}
              </h3>
              <MatchCard 
                match={enrichedSelectedMatch as any}
                prediction={predictions?.[enrichedSelectedMatch.id]}
                onSavePrediction={onSavePrediction}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
