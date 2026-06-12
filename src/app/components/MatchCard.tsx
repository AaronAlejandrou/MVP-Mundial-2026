import { useState, useEffect, useMemo } from 'react';
import { Lock, Check, Clock, MapPin, Trophy, Plus, Minus, Table2, ChevronRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { CountryFlag } from './CountryFlag';
import { GroupHoverCard } from './GroupHoverCard';
import { TeamHoverCard } from './TeamHoverCard';

interface Match {
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
}

export function MatchCard({ match, prediction, onSavePrediction, onViewGroup, onViewTeam }: MatchCardProps) {
  const [golesA, setGolesA] = useState<number>(prediction?.goles_a || 0);
  const [golesB, setGolesB] = useState<number>(prediction?.goles_b || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showGroupHover, setShowGroupHover] = useState(false);
  const [showTeamAHover, setShowTeamAHover] = useState(false);
  const [showTeamBHover, setShowTeamBHover] = useState(false);
  const [tick, setTick] = useState(0);

  // Tick every second so the countdown is live
  useEffect(() => {
    if (match.estado !== 'pendiente') return;
    const id = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(id);
  }, [match.estado]);

  const { minutesUntilMatch, secondsUntilMatch, isLocked, formattedTime } = useMemo(() => {
    const matchDate = new Date(match.fecha_hora);
    const now = new Date();
    const diffMs = matchDate.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    const locked = diffMinutes <= 25 || match.estado !== 'pendiente';

    const timeStr = format(matchDate, 'HH:mm');

    return {
      minutesUntilMatch: diffMinutes,
      secondsUntilMatch: diffSeconds,
      isLocked: locked,
      formattedTime: timeStr
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

  // Color escalates toward red only when no prediction saved
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
    if (team === 'a') {
      setGolesA(prev => Math.min(prev + 1, 99));
    } else {
      setGolesB(prev => Math.min(prev + 1, 99));
    }
  };

  const decrement = (team: 'a' | 'b') => {
    if (isLocked) return;
    if (team === 'a') {
      setGolesA(prev => Math.max(prev - 1, 0));
    } else {
      setGolesB(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className="relative w-full">
      {/* Main Card */}
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
            {/* Group Button with Hover */}
            <div className="relative flex-shrink-0" id={`group-btn-${match.id}`}>
              <button
                onMouseEnter={() => setShowGroupHover(true)}
                onMouseLeave={() => setShowGroupHover(false)}
                onClick={() => onViewGroup?.(match.grupo)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-muted hover:bg-primary hover:text-white text-foreground transition-all flex items-center gap-1.5 border border-border hover:border-primary group"
                title={`Ver tabla y partidos del Grupo ${match.grupo}`}
              >
                <Table2 className="w-3 h-3 text-primary group-hover:text-white transition-colors" />
                <span>GRUPO {match.grupo}</span>
                <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Match Body */}
        <div className="px-3 sm:px-5 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center flex-1 min-w-0 relative" id={`team-a-${match.id}`}>
              <button
                onMouseEnter={() => setShowTeamAHover(true)}
                onMouseLeave={() => setShowTeamAHover(false)}
                onClick={() => onViewTeam?.(match.equipo_a, match.grupo)}
                className="flex flex-col items-center w-full cursor-pointer group relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
                title={`Ver tabla del Grupo ${match.grupo}`}
              >
                <CountryFlag country={match.equipo_a} size="md" className="mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary text-center leading-tight truncate w-full px-1 transition-colors">
                  {match.equipo_a}
                </span>
              </button>
            </div>

            {/* Score Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Team A Score */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button
                  onClick={() => increment('a')}
                  disabled={isLocked}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-score text-3xl sm:text-4xl font-bold shadow-sm bg-background border-2 border-border text-foreground">
                  {golesA}
                </div>
                <button
                  onClick={() => decrement('a')}
                  disabled={isLocked || golesA === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-destructive text-destructive-foreground"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <span className="text-xl sm:text-2xl font-bold text-muted-foreground">-</span>

              {/* Team B Score */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <button
                  onClick={() => increment('b')}
                  disabled={isLocked}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center font-score text-3xl sm:text-4xl font-bold shadow-sm bg-background border-2 border-border text-foreground">
                  {golesB}
                </div>
                <button
                  onClick={() => decrement('b')}
                  disabled={isLocked || golesB === 0}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 shadow-sm bg-destructive text-destructive-foreground"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center flex-1 min-w-0 relative" id={`team-b-${match.id}`}>
              <button
                onMouseEnter={() => setShowTeamBHover(true)}
                onMouseLeave={() => setShowTeamBHover(false)}
                onClick={() => onViewTeam?.(match.equipo_b, match.grupo)}
                className="flex flex-col items-center w-full cursor-pointer group relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
                title={`Ver tabla del Grupo ${match.grupo}`}
              >
                <CountryFlag country={match.equipo_b} size="md" className="mb-1 sm:mb-2 transition-transform group-hover:scale-110" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary text-center leading-tight truncate w-full px-1 transition-colors">
                  {match.equipo_b}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
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

        {/* Resultado final + resumen del pronóstico */}
        {match.estado === 'finalizado' && match.goles_a !== null && match.goles_b !== null && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5 space-y-3">
            <div className="space-y-2">
              {/* Resultado oficial */}
              <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-foreground/5 border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Resultado</span>
                <span className="font-score text-xl font-bold text-foreground">
                  {match.goles_a} – {match.goles_b}
                </span>
              </div>
              {/* Pronóstico del jugador */}
              {prediction && (
                <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Tu pronóstico</span>
                  <span className="font-score text-xl font-bold text-primary">
                    {prediction.goles_a} – {prediction.goles_b}
                  </span>
                </div>
              )}
            </div>

            {/* Puntos obtenidos explícitos */}
            {prediction?.puntos_obtenidos !== undefined && (
              <div className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm ${
                prediction.puntos_obtenidos === 5 
                  ? 'bg-accent/10 border-accent/40 text-accent' 
                  : prediction.puntos_obtenidos > 0 
                    ? 'bg-secondary/10 border-secondary/40 text-secondary'
                    : 'bg-muted/50 border-border text-muted-foreground'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5" />
                  <span className="font-score text-2xl font-bold">+{prediction.puntos_obtenidos} Pts</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">
                  {prediction.puntos_obtenidos === 5 
                    ? 'Marcador exacto' 
                    : prediction.puntos_obtenidos === 2
                      ? 'Resultado ganador / Empate'
                      : 'Ningún acierto'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Partido próximo bloqueado (no finalizado pero sin predicción permitida) */}
        {isLocked && match.estado !== 'finalizado' && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            <div className="flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border-2 border-destructive/40 bg-destructive/5 text-destructive">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-bold">Pronóstico cerrado</span>
            </div>
          </div>
        )}
      </div>

      {/* Hover Cards - Positioned outside overflow-hidden context */}
      {showGroupHover && (
        <div
          className="absolute top-12 right-0 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={() => setShowGroupHover(true)}
          onMouseLeave={() => setShowGroupHover(false)}
          style={{
            animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out',
          }}
        >
          <GroupHoverCard grupo={match.grupo} />
        </div>
      )}

      {showTeamAHover && (
        <div
          className="absolute top-32 left-0 sm:left-8 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={() => setShowTeamAHover(true)}
          onMouseLeave={() => setShowTeamAHover(false)}
          style={{
            animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out',
          }}
        >
          <TeamHoverCard team={match.equipo_a} />
        </div>
      )}

      {showTeamBHover && (
        <div
          className="absolute top-32 right-0 sm:right-8 z-[100] hidden sm:block pointer-events-auto"
          onMouseEnter={() => setShowTeamBHover(true)}
          onMouseLeave={() => setShowTeamBHover(false)}
          style={{
            animation: 'fadeIn 0.2s ease-out, zoomIn 0.2s ease-out',
          }}
        >
          <TeamHoverCard team={match.equipo_b} />
        </div>
      )}
    </div>
  );
}
