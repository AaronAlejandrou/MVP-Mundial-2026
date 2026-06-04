import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, AlertTriangle, Check, ChevronUp, ChevronDown,
  Lock, Unlock, RefreshCw, ArrowUp, ArrowDown, Loader2
} from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { GROUP_STAGE_MATCHES } from '../../data/groupStageMatches';
import { apiFetch } from '../../lib/api';

interface TeamStat {
  equipo: string;
  pj: number; pg: number; pe: number; pp: number;
  gf: number; gc: number; dif: number; pts: number;
}

interface GroupData {
  grupo: string;
  equipos: TeamStat[];
}

interface BracketManagerProps {
  league: any;
  accessToken: string;
  matchResults: Record<number, any>;
  onBracketConfirmed: () => void;
}

export function BracketManager({ league, accessToken, matchResults, onBracketConfirmed }: BracketManagerProps) {
  const [phase, setPhase] = useState<{ groupStageOpen: boolean; bracketLocked: boolean; lockedAt: string | null } | null>(null);
  const [standings, setStandings] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('A');

  const loadPhase = useCallback(async () => {
    try {
      const res = await apiFetch(`/bracket/phase?leagueId=${league.id}`);
      if (res.ok) setPhase(await res.json());
    } catch { /* silent */ }
  }, [league.id]);

  const loadPreview = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      // Calcular standings localmente
      const gruposMap: Record<string, Record<string, TeamStat>> = {};

      // Inicializar
      GROUP_STAGE_MATCHES.forEach(m => {
        if (!gruposMap[m.grupo]) gruposMap[m.grupo] = {};
        if (!gruposMap[m.grupo][m.equipo_a]) {
          gruposMap[m.grupo][m.equipo_a] = { equipo: m.equipo_a, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
        }
        if (!gruposMap[m.grupo][m.equipo_b]) {
          gruposMap[m.grupo][m.equipo_b] = { equipo: m.equipo_b, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
        }
      });

      // Procesar resultados
      GROUP_STAGE_MATCHES.forEach(m => {
        const result = matchResults[m.id];
        if (result && result.estado === 'finalizado') {
          const tA = gruposMap[m.grupo][m.equipo_a];
          const tB = gruposMap[m.grupo][m.equipo_b];
          const ga = result.golesA;
          const gb = result.golesB;

          tA.pj++; tB.pj++;
          tA.gf += ga; tA.gc += gb; tA.dif = tA.gf - tA.gc;
          tB.gf += gb; tB.gc += ga; tB.dif = tB.gf - tB.gc;

          if (ga > gb) { tA.pg++; tA.pts += 3; tB.pp++; }
          else if (gb > ga) { tB.pg++; tB.pts += 3; tA.pp++; }
          else { tA.pe++; tB.pe++; tA.pts += 1; tB.pts += 1; }
        }
      });

      const parsed: GroupData[] = Object.keys(gruposMap).sort().map(grupo => {
        const equipos = Object.values(gruposMap[grupo]).sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          if (b.dif !== a.dif) return b.dif - a.dif;
          return b.gf - a.gf;
        });
        return { grupo, equipos };
      });

      setStandings(parsed);
    } catch { setError('Error calculando tabla'); }
    setIsLoading(false);
  }, [matchResults]);

  useEffect(() => {
    loadPhase();
    loadPreview();
  }, [loadPhase, loadPreview]);

  // Mover equipo hacia arriba en su grupo
  const moveUp = (grupoIdx: number, teamIdx: number) => {
    if (teamIdx === 0) return;
    setStandings(prev => {
      const next = prev.map(g => ({ ...g, equipos: [...g.equipos] }));
      const g = next[grupoIdx].equipos;
      [g[teamIdx - 1], g[teamIdx]] = [g[teamIdx], g[teamIdx - 1]];
      return next;
    });
  };

  // Mover equipo hacia abajo en su grupo
  const moveDown = (grupoIdx: number, teamIdx: number) => {
    setStandings(prev => {
      const next = prev.map(g => ({ ...g, equipos: [...g.equipos] }));
      const g = next[grupoIdx].equipos;
      if (teamIdx >= g.length - 1) return next;
      [g[teamIdx], g[teamIdx + 1]] = [g[teamIdx + 1], g[teamIdx]];
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!window.confirm(
      '¿Confirmar el bracket? Esta acción cerrará la fase de grupos y armará las llaves eliminatorias. No se puede deshacer.'
    )) return;

    setIsConfirming(true);
    setError(null);
    try {
      const res = await apiFetch('/bracket/confirm-standings', {
        method: 'POST',
        token: accessToken,
        body: { leagueId: league.id, standings },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Bracket confirmado! Las llaves ya están disponibles para todos.');
        await loadPhase();
        onBracketConfirmed();
      } else {
        setError(data.error || 'Error al confirmar el bracket');
      }
    } catch { setError('Error de conexión'); }
    setIsConfirming(false);
  };

  // ── Si el bracket ya está bloqueado ──
  if (phase?.bracketLocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-secondary/10 border-2 border-secondary rounded-xl">
          <Lock className="w-6 h-6 text-secondary flex-shrink-0" />
          <div>
            <p className="font-bold text-secondary">Bracket confirmado y bloqueado</p>
            {phase.lockedAt && (
              <p className="text-xs text-muted-foreground">
                Confirmado el {new Date(phase.lockedAt).toLocaleString('es-PE')}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Las llaves eliminatorias ya están activas. Los participantes pueden ver y pronosticar los partidos.
        </p>
      </div>
    );
  }

  const totalMatches = 72;
  const finishedCount = standings.reduce((acc, g) =>
    acc + g.equipos.reduce((a, e) => a + e.pj, 0) / 2, 0
  );
  const pct = Math.round((finishedCount / totalMatches) * 100);

  return (
    <div className="space-y-5">
      {/* Estado */}
      <div className="bg-accent/10 border-2 border-accent/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-accent" />
            <span className="font-bold text-foreground">Fase de Grupos activa</span>
          </div>
          <span className="text-xs font-bold text-accent">{Math.round(finishedCount)}/{totalMatches} partidos</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Completa todos los partidos e ingresa sus resultados antes de confirmar el bracket.
        </p>
      </div>

      {/* Instrucción */}
      <div className="bg-muted rounded-xl p-3 border border-border text-sm text-muted-foreground">
        <p>
          <span className="font-bold text-foreground">Instrucciones:</span>{' '}
          La tabla se calcula automáticamente por Pts → Dif. de Goles → Goles a Favor.
          Usa las flechas <ArrowUp className="inline w-3 h-3" /><ArrowDown className="inline w-3 h-3" /> para ajustar el orden en caso de empate no resoluble.
          Cuando estés conforme, pulsa <span className="font-bold text-accent">Confirmar Bracket</span>.
        </p>
      </div>

      {/* Botón recargar */}
      <div className="flex justify-end">
        <button
          onClick={loadPreview}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Recalcular
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm font-medium text-destructive">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/30 rounded-lg text-sm font-medium text-secondary">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Tabla por grupo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {standings.map((group, gi) => (
            <div key={group.grupo} className="border-2 border-border rounded-xl overflow-hidden">
              {/* Header del grupo */}
              <button
                onClick={() => setExpandedGroup(expandedGroup === group.grupo ? null : group.grupo)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary text-sm">GRUPO {group.grupo}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.equipos.filter(e => e.pj > 0).length === 4
                      ? '• Completo ✓'
                      : `• ${group.equipos.reduce((a, e) => a + e.pj, 0) / 2}/3 partidos`}
                  </span>
                </div>
                {expandedGroup === group.grupo
                  ? <ChevronUp className="w-4 h-4 text-primary" />
                  : <ChevronDown className="w-4 h-4 text-primary" />
                }
              </button>

              {expandedGroup === group.grupo && (
                <div className="bg-white">
                  {/* Cabecera tabla */}
                  <div className="grid grid-cols-[auto_1fr_repeat(7,_auto)_auto] gap-x-2 items-center px-3 py-1.5 border-b border-border bg-muted/30">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">#</span>
                    <span className="text-[10px] font-bold text-muted-foreground">Equipo</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-6">PJ</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-6">PG</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-6">PE</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-6">PP</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-8">GF</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-8">GC</span>
                    <span className="text-[10px] font-bold text-muted-foreground text-center w-8">DIF</span>
                    <span className="text-[10px] font-bold text-primary text-center w-8">PTS</span>
                  </div>

                  {group.equipos.map((team, ti) => {
                    const isQ1 = ti === 0;
                    const isQ2 = ti === 1;
                    const isQ3 = ti === 2;

                    return (
                      <div
                        key={team.equipo}
                        className={`grid grid-cols-[auto_1fr_repeat(7,_auto)_auto] gap-x-2 items-center px-3 py-2 border-b border-border/40 last:border-0 ${
                          isQ1 ? 'bg-secondary/8' : isQ2 ? 'bg-secondary/4' : isQ3 ? 'bg-accent/5' : ''
                        }`}
                      >
                        {/* Posición + color */}
                        <div className="flex items-center gap-1 w-4">
                          <div className={`w-1 h-6 rounded-full ${
                            isQ1 ? 'bg-secondary' : isQ2 ? 'bg-secondary/60' : isQ3 ? 'bg-accent' : 'bg-muted'
                          }`} />
                          <span className={`text-xs font-bold ${
                            isQ1 ? 'text-secondary' : isQ2 ? 'text-secondary/80' : isQ3 ? 'text-accent' : 'text-muted-foreground'
                          }`}>{ti + 1}</span>
                        </div>

                        {/* Nombre + bandera */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CountryFlag country={team.equipo} size="xs" />
                          <span className="text-xs font-bold truncate">{team.equipo}</span>
                        </div>

                        {/* Estadísticas */}
                        <span className="text-xs text-center text-muted-foreground w-6">{team.pj}</span>
                        <span className="text-xs text-center text-muted-foreground w-6">{team.pg}</span>
                        <span className="text-xs text-center text-muted-foreground w-6">{team.pe}</span>
                        <span className="text-xs text-center text-muted-foreground w-6">{team.pp}</span>
                        <span className="text-xs text-center text-muted-foreground w-8">{team.gf}</span>
                        <span className="text-xs text-center text-muted-foreground w-8">{team.gc}</span>
                        <span className={`text-xs text-center font-bold w-8 ${team.dif > 0 ? 'text-secondary' : team.dif < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {team.dif > 0 ? `+${team.dif}` : team.dif}
                        </span>
                        <span className="text-sm font-bold text-primary text-center w-8">{team.pts}</span>
                      </div>
                    );
                  })}

                  {/* Controles de reordenamiento */}
                  <div className="px-3 py-2 bg-muted/20 border-t border-border">
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Ajustar orden (empates):</p>
                    <div className="space-y-1">
                      {group.equipos.map((team, ti) => (
                        <div key={team.equipo} className="flex items-center justify-between gap-2 py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground w-3">{ti + 1}.</span>
                            <CountryFlag country={team.equipo} size="xs" />
                            <span className="text-[10px] font-bold truncate">{team.equipo}</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => moveUp(gi, ti)}
                              disabled={ti === 0}
                              className="w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveDown(gi, ti)}
                              disabled={ti === group.equipos.length - 1}
                              className="w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div className="px-3 pb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block" />1º–2º → Clasifican</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" />3º → Mejor 3ro</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botón confirmar */}
      {!phase?.bracketLocked && standings.length > 0 && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t-2 border-border mt-4">
          <button
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
            className="w-full py-3 px-6 bg-accent text-accent-foreground rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirmando bracket...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Confirmar Bracket y Armar Llaves
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-muted-foreground mt-1.5">
            ⚠️ Esta acción es irreversible. Cierra la fase de grupos y activa los 16avos de final.
          </p>
        </div>
      )}
    </div>
  );
}
