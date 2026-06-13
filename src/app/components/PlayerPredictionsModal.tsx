import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Target, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CountryFlag } from './CountryFlag';
import { GROUP_STAGE_MATCHES } from '../../data/groupStageMatches';
import { apiFetch } from '../../lib/api';

interface PlayerPrediction {
  matchId: number;
  goles_a: number;
  goles_b: number;
  puntos_obtenidos: number | null;
  resultado: { goles_a: number; goles_b: number; estado: string } | null;
}

interface Player {
  id: string;
  nombre: string;
  puntaje_total: number;
  marcadores_exactos?: number;
}

interface PlayerPredictionsModalProps {
  player: Player;
  leagueId: string;
  accessToken: string;
  currentUserId?: string;
  onClose: () => void;
}

export function PlayerPredictionsModal({ player, leagueId, accessToken, currentUserId, onClose }: PlayerPredictionsModalProps) {
  const [predictions, setPredictions] = useState<PlayerPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/player-predictions/locked?userId=${player.id}&leagueId=${leagueId}`, { token: accessToken });
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.predictions || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, [player.id, leagueId]);

  useEffect(() => {
    if (!loading && todayRef.current) {
      setTimeout(() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [loading]);

  // Build enriched predictions joined with match data
  const enriched = useMemo(() => {
    return predictions
      .map(p => {
        const match = GROUP_STAGE_MATCHES.find(m => m.id === p.matchId);
        if (!match) return null;
        return { ...p, match };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(a.match.fecha_hora).getTime() - new Date(b.match.fecha_hora).getTime());
  }, [predictions]);

  // Group by local date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof enriched> = {};
    for (const item of enriched) {
      if (!item) continue;
      const dateKey = format(new Date((item as any).match.fecha_hora), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }
    return groups;
  }, [enriched]);

  const sortedDates = Object.keys(grouped).sort();

  const exactos = predictions.filter(p => p.puntos_obtenidos === 5).length;
  const aciertos = predictions.filter(p => (p.puntos_obtenidos ?? 0) >= 2).length;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] sm:max-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              player.id === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {player.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{player.nombre}</p>
              <p className="text-xs text-muted-foreground">{player.puntaje_total} pts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Stats bar */}
        {!loading && predictions.length > 0 && (
          <div className="flex gap-3 px-5 py-3 border-b border-border bg-muted/20 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-foreground">{exactos} exacto{exactos !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-foreground">{aciertos} acierto{aciertos !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-px bg-border" />
            <span className="text-xs text-muted-foreground">{predictions.length} pronósticos bloqueados</span>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 pb-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : predictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Sin pronósticos bloqueados aún</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Aparecerán conforme los partidos se bloqueen</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedDates.map(dateKey => {
                const dateItems = grouped[dateKey] || [];
                const dateObj = new Date(`${dateKey}T12:00:00`);
                const isCurrentDay = isToday(dateObj);
                const label = isCurrentDay
                  ? 'Hoy'
                  : format(dateObj, "EEEE d 'de' MMMM", { locale: es });

                return (
                  <div key={dateKey} ref={isCurrentDay ? todayRef : null} className="scroll-mt-4">
                    {/* Sticky date header */}
                    <div className="sticky top-0 z-10 px-5 py-2 bg-card border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-widest capitalize ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                          {label}
                        </span>
                        {isCurrentDay && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match predictions for this day */}
                    <div className="px-4 py-2 space-y-2">
                      {dateItems.map((item: any, i: number) => {
                        const { match, goles_a, goles_b, puntos_obtenidos, resultado } = item;
                        const isFinished = resultado?.estado === 'finalizado';
                        const pts = puntos_obtenidos ?? null;

                        return (
                          <div key={i} className={`rounded-2xl border p-3 transition-all ${
                            pts === 5
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : pts === 2
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : pts === 0
                              ? 'bg-muted/30 border-border'
                              : 'bg-muted/20 border-border/60'
                          }`}>
                            {/* Teams */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <CountryFlag country={match.equipo_a} size="xs" />
                                <span className="text-xs font-bold text-foreground truncate max-w-[60px]">{match.equipo_a}</span>
                              </div>
                              <span className="font-score font-black text-base text-foreground mx-2 flex-shrink-0">
                                {goles_a} – {goles_b}
                              </span>
                              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                                <span className="text-xs font-bold text-foreground truncate max-w-[60px] text-right">{match.equipo_b}</span>
                                <CountryFlag country={match.equipo_b} size="xs" />
                              </div>
                            </div>

                            {/* Result row */}
                            {isFinished && resultado && (
                              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Resultado</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-score text-xs font-bold text-foreground">{resultado.goles_a}–{resultado.goles_b}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    pts === 5
                                      ? 'bg-amber-500/15 text-amber-500'
                                      : pts === 2
                                      ? 'bg-emerald-500/15 text-emerald-500'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {pts === 5 ? '+5 Exacto' : pts === 2 ? '+2 Acierto' : '+0'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Locked but not finished */}
                            {!isFinished && (
                              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/50">
                                <span className="text-[10px] text-muted-foreground/60">En curso o próximamente</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
