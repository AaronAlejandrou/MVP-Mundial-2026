import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Users, BarChart2, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { apiFetch } from '../../lib/api';

interface ScoreSummary {
  goles_a: number;
  goles_b: number;
  count: number;
}

interface NamedPrediction {
  userId: string;
  nombre: string;
  goles_a: number;
  goles_b: number;
  puntos_obtenidos: number | null;
  ranking: number;
}

interface RankingSnapshotRow {
  userId: string;
  nombre: string;
  total: number;
  posicion: number;
  posicionAnterior: number;
  delta: number;
  puntosEstePartido: number;
}

interface Match {
  id: number;
  equipo_a: string;
  equipo_b: string;
  estado?: string;
  goles_a?: number | null;
  goles_b?: number | null;
}

interface MatchPredictionsModalProps {
  match: Match;
  leagueId: string;
  accessToken: string;
  currentUserId?: string;
  mode: 'summary' | 'full' | 'winners';
  onClose: () => void;
}

export function MatchPredictionsModal({ match, leagueId, accessToken, currentUserId, mode, onClose }: MatchPredictionsModalProps) {
  const [summary, setSummary] = useState<ScoreSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [predictions, setPredictions] = useState<NamedPrediction[]>([]);
  const [snapshot, setSnapshot] = useState<RankingSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (mode === 'summary') {
          const res = await apiFetch(`/match-predictions/summary?matchId=${match.id}&leagueId=${leagueId}`);
          if (res.ok) {
            const data = await res.json();
            setSummary(data.summary || []);
            setTotal(data.total || 0);
          }
        } else {
          const res = await apiFetch(`/match-predictions/all?matchId=${match.id}&leagueId=${leagueId}`, { token: accessToken });
          if (res.ok) {
            const data = await res.json();
            setPredictions(data.predictions || []);
            setTotal(data.predictions?.length || 0);
          }
          if (mode === 'winners') {
            const snapRes = await apiFetch(`/match-predictions/ranking-snapshot?matchId=${match.id}&leagueId=${leagueId}`, { token: accessToken });
            if (snapRes.ok) {
              const snapData = await snapRes.json();
              setSnapshot(snapData.snapshot || []);
            }
          }
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, [match.id, leagueId, mode]);

  const maxCount = summary.length > 0 ? summary[0].count : 1;

  const winners = predictions.filter(p => (p.puntos_obtenidos ?? 0) > 0);
  const losers = predictions.filter(p => (p.puntos_obtenidos ?? 0) === 0);

  const title = mode === 'summary'
    ? 'Pronósticos del partido'
    : mode === 'winners'
    ? 'Resultados del partido'
    : 'Todos los pronósticos';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full ${mode === 'winners' ? 'sm:max-w-3xl' : 'sm:max-w-md'} bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] sm:max-h-full flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {mode === 'summary' ? (
              <BarChart2 className="w-4 h-4 text-primary" />
            ) : mode === 'winners' ? (
              <Trophy className="w-4 h-4 text-amber-500" />
            ) : (
              <Users className="w-4 h-4 text-primary" />
            )}
            <div>
              <p className="font-bold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CountryFlag country={match.equipo_a} size="xs" />
                {match.equipo_a} vs {match.equipo_b}
                <CountryFlag country={match.equipo_b} size="xs" />
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Total badge */}
        {!loading && mode !== 'winners' && (
          <div className="px-5 py-3 border-b border-border/50">
            <span className="text-xs font-bold text-muted-foreground">
              {total} pronóstico{total !== 1 ? 's' : ''} en total
            </span>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 pt-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : mode === 'summary' ? (
            // ── Vista anónima: distribución de marcadores ──
            <div className="space-y-2.5 mt-2">
              {summary.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Nadie ha apostado aún</p>
              ) : summary.map((s, i) => {
                const isExact = match.estado === 'finalizado'
                  && s.goles_a === match.goles_a
                  && s.goles_b === match.goles_b;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`font-score text-base font-bold w-10 text-center flex-shrink-0 ${isExact ? 'text-emerald-400' : 'text-foreground'}`}>
                      {s.goles_a}–{s.goles_b}
                    </span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isExact ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-14 text-right flex-shrink-0 ${isExact ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {s.count} {s.count === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : mode === 'winners' ? (
            // ── Dos columnas: izquierda ganadores · derecha ranking del momento ──
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mt-2">
              {/* Izquierda: ganadores */}
              <div className="space-y-3 sm:border-r sm:border-border/60 sm:pr-6">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Pronósticos · {total} en total
                </div>
                {predictions.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Sin datos aún</p>
                ) : (
                  <>
                    {winners.length > 0 && (
                      <div className="space-y-1.5">
                        {winners.map((p, i) => (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                            p.puntos_obtenidos === 5
                              ? 'bg-amber-500/8 border-amber-500/20'
                              : 'bg-emerald-500/8 border-emerald-500/20'
                          } ${p.userId === currentUserId ? 'ring-1 ring-primary' : ''}`}>
                            <span className={`text-xs font-black w-4 text-center flex-shrink-0 ${p.puntos_obtenidos === 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {p.ranking}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-foreground truncate">
                              {p.nombre}{p.userId === currentUserId ? ' (tú)' : ''}
                            </span>
                            <span className="font-score text-sm font-bold text-foreground flex-shrink-0">
                              {p.goles_a}–{p.goles_b}
                            </span>
                            <span className={`text-xs font-black flex-shrink-0 ${p.puntos_obtenidos === 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              +{p.puntos_obtenidos}pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {losers.length > 0 && (
                      <details className="group">
                        <summary className="text-xs font-bold text-muted-foreground cursor-pointer py-1 list-none flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 rotate-180" />
                          {losers.length} sin puntos
                        </summary>
                        <div className="space-y-1 mt-1.5">
                          {losers.map((p, i) => (
                            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-muted/30 ${p.userId === currentUserId ? 'ring-1 ring-primary' : ''}`}>
                              <span className="text-xs font-black w-4 text-center flex-shrink-0 text-muted-foreground/50">{p.ranking}</span>
                              <span className="flex-1 text-sm font-medium text-muted-foreground truncate">
                                {p.nombre}{p.userId === currentUserId ? ' (tú)' : ''}
                              </span>
                              <span className="font-score text-sm font-bold text-muted-foreground flex-shrink-0">
                                {p.goles_a}–{p.goles_b}
                              </span>
                              <span className="text-xs text-muted-foreground/60 flex-shrink-0">0pts</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>

              {/* Derecha: ranking tras este partido */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Ranking tras este partido
                </div>
                {snapshot.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">El ranking aparecerá cuando el partido tenga resultado</p>
                ) : snapshot.map((r) => (
                  <div key={r.userId} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${
                    r.userId === currentUserId
                      ? 'bg-primary/8 border-primary/30 ring-1 ring-primary/20'
                      : 'bg-muted/30 border-border'
                  }`}>
                    <span className={`text-xs font-black w-5 text-center flex-shrink-0 ${r.userId === currentUserId ? 'text-primary' : 'text-foreground'}`}>
                      {r.posicion}
                    </span>
                    <span className="w-7 flex-shrink-0 flex items-center justify-center">
                      {r.delta > 0 ? (
                        <span className="flex items-center text-[11px] font-black text-emerald-500"><ArrowUp className="w-3 h-3" />{r.delta}</span>
                      ) : r.delta < 0 ? (
                        <span className="flex items-center text-[11px] font-black text-rose-500"><ArrowDown className="w-3 h-3" />{Math.abs(r.delta)}</span>
                      ) : (
                        <Minus className="w-3 h-3 text-muted-foreground/40" />
                      )}
                    </span>
                    <span className={`flex-1 text-sm font-semibold truncate ${r.userId === currentUserId ? 'text-primary' : 'text-foreground'}`}>
                      {r.nombre}{r.userId === currentUserId ? ' (tú)' : ''}
                    </span>
                    {r.puntosEstePartido > 0 && (
                      <span className="text-[10px] font-black text-emerald-500 flex-shrink-0">+{r.puntosEstePartido}</span>
                    )}
                    <span className="font-score text-sm font-bold text-foreground w-7 text-right flex-shrink-0">{r.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // ── Vista completa: todos los participantes en orden ranking ──
            <div className="space-y-1.5 mt-2">
              {predictions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Sin pronósticos registrados</p>
              ) : predictions.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  p.userId === currentUserId
                    ? 'bg-primary/8 border-primary/30 ring-1 ring-primary/20'
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}>
                  <span className="text-xs font-black w-4 text-center flex-shrink-0 text-muted-foreground/60">{p.ranking}</span>
                  <span className={`flex-1 text-sm font-semibold truncate ${p.userId === currentUserId ? 'text-primary' : 'text-foreground'}`}>
                    {p.nombre}{p.userId === currentUserId ? ' (tú)' : ''}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-score text-base font-bold text-foreground">
                      {p.goles_a}–{p.goles_b}
                    </span>
                    {match.estado === 'finalizado' && p.puntos_obtenidos !== null && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        p.puntos_obtenidos === 5
                          ? 'bg-amber-500/15 text-amber-500'
                          : p.puntos_obtenidos === 2
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {p.puntos_obtenidos === 5 ? 'Exacto' : p.puntos_obtenidos === 2 ? 'Acierto' : '0pts'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
