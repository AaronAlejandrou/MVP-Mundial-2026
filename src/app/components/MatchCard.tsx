import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Check, Clock, MapPin, Trophy, Plus, Minus, Table2, ChevronRight, BarChart2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { CountryFlag } from './CountryFlag';
import { GroupHoverCard } from './GroupHoverCard';
import { TeamHoverCard } from './TeamHoverCard';
import { MatchPredictionsModal } from './MatchPredictionsModal';

interface Match {
  id: number;
  equipo_a: string;
  equipo_b: string;
  fecha_hora: string;
  estadio: string;
  grupo: string;
  goles_a?: number | null;
  goles_b?: number | null;
  estado?: 'pendiente' | 'en_curso' | 'finalizado';
  api_status?: string | null;
  minuto?: string | null;
}

function getPhaseLabel(apiStatus: string | null | undefined, minuto: string | null | undefined, isLive: boolean, estado: string | undefined): React.ReactNode {
  if (estado === 'finalizado') return 'Resultado final';
  if (!apiStatus) return isLive ? <>Resultado <span className="text-rose-500">en vivo</span></> : 'Resultado';
  if (apiStatus === 'HT') return '⏸ Medio tiempo';
  if (apiStatus === '1H') return <>Primer tiempo{minuto ? <> · <span className="text-rose-500">{minuto}'</span></> : null}</>;
  if (apiStatus === '2H') return <>Segundo tiempo{minuto ? <> · <span className="text-rose-500">{minuto}'</span></> : null}</>;
  if (['FT','ET','AET','BT','P','PEN'].includes(apiStatus)) return 'Resultado final';
  return isLive ? <>Resultado <span className="text-rose-500">en vivo</span></> : 'Resultado';
}

interface Prediction {
  goles_a: number;
  goles_b: number;
  puntos_obtenidos?: number;
}

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onSavePrediction?: (matchId: number, golesA: number, golesB: number) => Promise<void>;
  onViewGroup?: (grupo: string) => void;
  onViewTeam?: (team: string, grupo: string) => void;
  leagueId?: string;
  accessToken?: string;
  currentUserId?: string;
  allMatches?: Match[];
}

export function MatchCard({ match, prediction, onSavePrediction, onViewGroup, onViewTeam, leagueId, accessToken, currentUserId, allMatches }: MatchCardProps) {
  const [golesA, setGolesA] = useState<number>(prediction?.goles_a || 0);
  const [golesB, setGolesB] = useState<number>(prediction?.goles_b || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showGroupHover, setShowGroupHover] = useState(false);
  const [showTeamAHover, setShowTeamAHover] = useState(false);
  const [showTeamBHover, setShowTeamBHover] = useState(false);
  const [tick, setTick] = useState(0);
  const [modalMode, setModalMode] = useState<'summary' | 'full' | 'winners' | null>(null);
  const [seenStats, setSeenStats] = useState(() => localStorage.getItem('polla_seen_stats') === '1');
  const [seenGrupo, setSeenGrupo] = useState(() => localStorage.getItem('polla_seen_grupo') === '1');
  const [seenVerTodos, setSeenVerTodos] = useState(() => localStorage.getItem('polla_seen_ver_todos') === '1');

  const groupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamATimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamBTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupBtnRef = useRef<HTMLDivElement>(null);

  const showGroup  = () => { if (groupTimer.current)  clearTimeout(groupTimer.current);  setShowGroupHover(true); };
  const hideGroup  = () => { groupTimer.current  = setTimeout(() => setShowGroupHover(false), 150); };
  const showTeamA  = () => { if (teamATimer.current)  clearTimeout(teamATimer.current);  setShowTeamAHover(true); };
  const hideTeamA  = () => { teamATimer.current  = setTimeout(() => setShowTeamAHover(false), 150); };
  const showTeamB  = () => { if (teamBTimer.current)  clearTimeout(teamBTimer.current);  setShowTeamBHover(true); };
  const hideTeamB  = () => { teamBTimer.current  = setTimeout(() => setShowTeamBHover(false), 150); };

  const getTeamRecent = (team: string) => {
    if (!allMatches) return [];
    return allMatches
      .filter(m => (m.equipo_a === team || m.equipo_b === team) && m.estado === 'finalizado')
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
      .slice(0, 2)
      .map(m => ({
        equipo_a: m.equipo_a,
        equipo_b: m.equipo_b,
        goles_a: m.goles_a ?? 0,
        goles_b: m.goles_b ?? 0,
        fecha: format(new Date(m.fecha_hora), 'dd/MM'),
      }));
  };

  useEffect(() => {
    if (match.estado !== 'pendiente') return;
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, [match.estado]);

  // Sincroniza dots entre todas las instancias de MatchCard cuando una descarta
  useEffect(() => {
    const sync = () => {
      setSeenStats(localStorage.getItem('polla_seen_stats') === '1');
      setSeenGrupo(localStorage.getItem('polla_seen_grupo') === '1');
      setSeenVerTodos(localStorage.getItem('polla_seen_ver_todos') === '1');
    };
    window.addEventListener('polla_dot_dismissed', sync);
    return () => window.removeEventListener('polla_dot_dismissed', sync);
  }, []);

  // Dispara re-render exactamente al cumplir 120 min del kickoff para quitar el pill EN VIVO
  useEffect(() => {
    if (match.estado === 'finalizado') return;
    const matchEndMs = new Date(match.fecha_hora).getTime() + 120 * 60 * 1000;
    const msUntilEnd = matchEndMs - Date.now();
    if (msUntilEnd <= 0) return;
    const id = setTimeout(() => setTick(t => t + 1), msUntilEnd);
    return () => clearTimeout(id);
  }, [match.fecha_hora, match.estado]);

  const { minutesUntilMatch, secondsUntilMatch, isLocked, isLive, formattedTime } = useMemo(() => {
    const matchDate = new Date(match.fecha_hora);
    const now = new Date();
    const diffMs = matchDate.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const locked = diffMinutes <= 25 || match.estado !== 'pendiente';
    const matchEndMs = matchDate.getTime() + 120 * 60 * 1000;
    const isLive = diffSeconds <= 0 && now.getTime() < matchEndMs && match.estado !== 'finalizado';
    return {
      minutesUntilMatch: diffMinutes,
      secondsUntilMatch: diffSeconds,
      isLocked: locked,
      isLive,
      formattedTime: format(matchDate, 'HH:mm'),
    };
  }, [match.fecha_hora, match.estado, tick]);

  const formatCountdown = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return '';
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, '0')}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  const countdownClass = useMemo(() => {
    if (isLocked || minutesUntilMatch <= 0) return '';
    if (prediction) return 'text-muted-foreground/40';
    if (minutesUntilMatch > 1440) return 'text-muted-foreground/40';
    if (minutesUntilMatch > 360)  return 'text-muted-foreground/60';
    if (minutesUntilMatch > 180)  return 'text-amber-400/70';
    return 'text-rose-400/90';
  }, [minutesUntilMatch, isLocked, prediction]);

  useEffect(() => {
    if (prediction) {
      setGolesA(prediction.goles_a);
      setGolesB(prediction.goles_b);
    }
  }, [prediction]);

  const dismissDot = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    localStorage.setItem(key, '1');
    setter(true);
    window.dispatchEvent(new Event('polla_dot_dismissed'));
  };

  const handleSave = async () => {
    if (!onSavePrediction || isLocked) return;
    setIsSaving(true);
    try {
      await onSavePrediction(match.id, golesA, golesB);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving prediction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    if (!prediction) return true;
    return golesA !== prediction.goles_a || golesB !== prediction.goles_b;
  };

  const canSave = !isLocked && hasChanges() && !isSaving;

  const increment = (team: 'a' | 'b') => {
    if (isLocked) return;
    if (team === 'a') setGolesA(prev => Math.min(prev + 1, 99));
    else setGolesB(prev => Math.min(prev + 1, 99));
  };

  const decrement = (team: 'a' | 'b') => {
    if (isLocked) return;
    if (team === 'a') setGolesA(prev => Math.max(prev - 1, 0));
    else setGolesB(prev => Math.max(prev - 1, 0));
  };

  const canShowModal = !!(leagueId && accessToken);

  return (
    <div className="relative w-full">
      <div className="bg-card rounded-xl shadow-mundial border border-border overflow-hidden transition-all duration-300 hover:shadow-mundial-lg max-w-full">
        {/* Header */}
        <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-border bg-muted">
          <div className="flex items-center justify-between flex-wrap gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 min-w-0">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-bold text-foreground flex-shrink-0">{formattedTime}</span>
              <span className="text-muted-foreground">•</span>
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground text-xs truncate">{match.estadio}</span>
              {match.estado === 'pendiente' && !isLocked && secondsUntilMatch > 0 && (
                <>
                  <span className="text-muted-foreground/40 flex-shrink-0">•</span>
                  <span className={`text-[10px] font-semibold tabular-nums flex-shrink-0 transition-colors duration-1000 ${countdownClass}`}>
                    {formatCountdown(secondsUntilMatch)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Pill EN VIVO — basado en tiempo, desaparece al finalizar */}
              {isLive && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider">En vivo</span>
                </div>
              )}
              {/* Botón stats anónimas — siempre visible */}
              {canShowModal && (
                <div className="relative">
                  <button
                    onClick={() => { dismissDot('polla_seen_stats', setSeenStats); setModalMode('summary'); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Stats
                  </button>
                  {!seenStats && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                  )}
                </div>
              )}
              {/* Group Button */}
              <div className="relative" ref={groupBtnRef} id={`group-btn-${match.id}`}>
                <button
                  onMouseEnter={showGroup}
                  onMouseLeave={hideGroup}
                  onClick={() => { dismissDot('polla_seen_grupo', setSeenGrupo); onViewGroup?.(match.grupo); }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-muted hover:bg-primary hover:text-white text-foreground transition-all flex items-center gap-1.5 border border-border hover:border-primary group"
                  title={`Ver tabla y partidos del Grupo ${match.grupo}`}
                >
                  <Table2 className="w-3 h-3 text-primary group-hover:text-white transition-colors" />
                  <span>GRUPO {match.grupo}</span>
                  <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
                {!seenGrupo && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Match Body */}
        <div className="px-3 sm:px-5 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center flex-1 min-w-0 relative" id={`team-a-${match.id}`}>
              <button
                onMouseEnter={showTeamA}
                onMouseLeave={hideTeamA}
                onClick={() => onViewTeam?.(match.equipo_a, match.grupo)}
                className="flex flex-col items-center w-full cursor-pointer group relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <CountryFlag country={match.equipo_a} size="md" className="mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary text-center leading-tight truncate w-full px-1 transition-colors">
                  {match.equipo_a}
                </span>
              </button>
            </div>

            {/* Score Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button onClick={() => increment('a')} disabled={isLocked}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-score text-3xl sm:text-4xl font-bold shadow-sm bg-background border-2 border-border text-foreground">
                  {golesA}
                </div>
                <button onClick={() => decrement('a')} disabled={isLocked || golesA === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-destructive text-destructive-foreground">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <span className="text-xl sm:text-2xl font-bold text-muted-foreground">-</span>

              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button onClick={() => increment('b')} disabled={isLocked}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-score text-3xl sm:text-4xl font-bold shadow-sm bg-background border-2 border-border text-foreground">
                  {golesB}
                </div>
                <button onClick={() => decrement('b')} disabled={isLocked || golesB === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-destructive text-destructive-foreground">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center flex-1 min-w-0 relative" id={`team-b-${match.id}`}>
              <button
                onMouseEnter={showTeamB}
                onMouseLeave={hideTeamB}
                onClick={() => onViewTeam?.(match.equipo_b, match.grupo)}
                className="flex flex-col items-center w-full cursor-pointer group relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <CountryFlag country={match.equipo_b} size="md" className="mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary text-center leading-tight truncate w-full px-1 transition-colors">
                  {match.equipo_b}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Guardar pronóstico */}
        {!isLocked && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm ${
                isSaved
                  ? 'bg-green-500 text-white shadow-green-500/25'
                  : canSave
                  ? 'bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5'
                  : prediction && prediction.goles_a === golesA && prediction.goles_b === golesB
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : isSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  ¡Guardado!
                </span>
              ) : !canSave && prediction && prediction.goles_a === golesA && prediction.goles_b === golesB ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Pronóstico Guardado
                </span>
              ) : (
                'Guardar Pronóstico'
              )}
            </button>
          </div>
        )}

        {/* Resultado — depende del estado real (no del corte de 120 min), solo cambia el label */}
        {match.goles_a !== null && match.goles_b !== null && (match.estado === 'finalizado' || match.estado === 'en_curso' || isLive) && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-foreground/5 border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {getPhaseLabel(match.api_status, match.minuto, isLive, match.estado)}
                </span>
                <span className="font-score text-xl font-bold text-foreground">
                  {match.goles_a} – {match.goles_b}
                </span>
              </div>
              {prediction && (
                <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Tu pronóstico</span>
                  <span className="font-score text-xl font-bold text-primary">
                    {prediction.goles_a} – {prediction.goles_b}
                  </span>
                </div>
              )}
            </div>

            {(prediction?.puntos_obtenidos !== undefined || canShowModal) && (
              <div className="flex gap-2 items-stretch min-h-[88px]">
                {/* Points box — takes remaining width */}
                {prediction?.puntos_obtenidos !== undefined && (
                  <div className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                    prediction.puntos_obtenidos === 5
                      ? 'bg-accent/10 border-accent/40 text-accent'
                      : prediction.puntos_obtenidos > 0
                      ? 'bg-secondary/10 border-secondary/40 text-secondary'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      <span className="font-score text-2xl font-bold">+{prediction.puntos_obtenidos} Pts</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center mt-0.5">
                      {prediction.puntos_obtenidos === 5
                        ? 'Marcador exacto'
                        : prediction.puntos_obtenidos === 2
                        ? 'Resultado ganador / Empate'
                        : 'Ningún acierto'}
                    </span>
                    {match.estado !== 'finalizado' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 mt-1">Provisional · por ahora</span>
                    )}
                  </div>
                )}

                {/* Results button box — ~20% width when alongside points, full when alone */}
                {canShowModal && (
                  <div className={`relative ${prediction?.puntos_obtenidos !== undefined ? 'w-1/5 flex-shrink-0' : 'flex-1'}`}>
                    <button
                      onClick={() => { dismissDot('polla_seen_ver_todos', setSeenVerTodos); setModalMode('winners'); }}
                      className={`w-full h-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors ${
                        prediction?.puntos_obtenidos !== undefined ? '' : 'py-3'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Resultados</span>
                    </button>
                    {!seenVerTodos && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Partido bloqueado — solo cuando no hay resultado (en vivo o post-120min) que mostrar */}
        {isLocked && match.estado !== 'finalizado' && !((isLive || match.estado === 'en_curso') && match.goles_a !== null && match.goles_b !== null) && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            <div className={`flex items-center gap-2 rounded-lg border-2 border-destructive/40 overflow-hidden ${canShowModal ? '' : ''}`}>
              <div className="flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 flex-1 bg-destructive/5 text-destructive">
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Pronóstico cerrado</span>
              </div>
              {canShowModal && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => { dismissDot('polla_seen_ver_todos', setSeenVerTodos); setModalMode('full'); }}
                    className="flex items-center justify-center gap-1.5 py-2 sm:py-3 px-3 sm:px-4 bg-primary/10 hover:bg-primary/20 text-primary transition-colors border-l border-destructive/40"
                    title="Ver todos los pronósticos"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold hidden sm:inline">Ver todos</span>
                  </button>
                  {!seenVerTodos && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hover Cards */}
      {showGroupHover && groupBtnRef.current && createPortal(
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: groupBtnRef.current.getBoundingClientRect().bottom + 4,
            right: window.innerWidth - groupBtnRef.current.getBoundingClientRect().right,
          }}
          onMouseEnter={showGroup}
          onMouseLeave={hideGroup}
        >
          <GroupHoverCard grupo={match.grupo} allMatches={allMatches} />
        </div>,
        document.body
      )}
      {showTeamAHover && (
        <div className="absolute top-32 left-0 sm:left-8 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={showTeamA} onMouseLeave={hideTeamA}
          style={{ animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out' }}>
          <TeamHoverCard team={match.equipo_a} recentMatches={getTeamRecent(match.equipo_a)} />
        </div>
      )}
      {showTeamBHover && (
        <div className="absolute top-32 right-0 sm:right-8 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={showTeamB} onMouseLeave={hideTeamB}
          style={{ animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out' }}>
          <TeamHoverCard team={match.equipo_b} recentMatches={getTeamRecent(match.equipo_b)} />
        </div>
      )}

      {/* Modal de predicciones */}
      {modalMode && canShowModal && (
        <MatchPredictionsModal
          match={match}
          leagueId={leagueId!}
          accessToken={accessToken!}
          currentUserId={currentUserId}
          mode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}
