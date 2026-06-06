import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, AlertTriangle, Check, ChevronUp, ChevronDown,
  Lock, Unlock, RefreshCw, ArrowUp, ArrowDown, Loader2, Award
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
  const [phase, setPhase] = useState<{ groupStageOpen: boolean; bracketLocked: boolean; lockedAt: string | null; confirmedGroups: string[] } | null>(null);
  const [standings, setStandings] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState<string | null>(null); // 'A', 'B', or 'thirds'
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('A');
  
  // Para los terceros
  const [thirds, setThirds] = useState<TeamStat[]>([]);

  const loadPhase = useCallback(async () => {
    try {
      const res = await apiFetch(`/bracket/phase?leagueId=${league.id}`);
      if (res.ok) setPhase(await res.json());
    } catch { /* silent */ }
  }, [league.id]);

  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calcular standings localmente basandonos en matchResults
      const gruposMap: Record<string, Record<string, TeamStat>> = {};

      GROUP_STAGE_MATCHES.forEach(m => {
        if (!gruposMap[m.grupo]) gruposMap[m.grupo] = {};
        if (!gruposMap[m.grupo][m.equipo_a]) {
          gruposMap[m.grupo][m.equipo_a] = { equipo: m.equipo_a, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
        }
        if (!gruposMap[m.grupo][m.equipo_b]) {
          gruposMap[m.grupo][m.equipo_b] = { equipo: m.equipo_b, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
        }
      });

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

      // Primero vemos si ya hay standings confirmados desde la bd
      const sfRes = await apiFetch(`/bracket/group-standings-final?leagueId=${league.id}`);
      let dbStandings: Record<string, any[]> = {};
      if (sfRes.ok) {
        const data = await sfRes.json();
        data.standings.forEach((g: any) => { dbStandings[g.grupo] = g.equipos; });
      }

      const parsed: GroupData[] = Object.keys(gruposMap).sort().map(grupo => {
        if (dbStandings[grupo]) {
          return { grupo, equipos: dbStandings[grupo] };
        }
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
  }, [matchResults, league.id]);

  useEffect(() => {
    loadPhase();
    loadPreview();
  }, [loadPhase, loadPreview]);

  // Construir la lista de terceros inicial cuando todos los grupos están confirmados
  useEffect(() => {
    if (phase?.confirmedGroups?.length === 12 && !phase?.bracketLocked && thirds.length === 0) {
      const allThirds: TeamStat[] = [];
      standings.forEach(g => {
        if (g.equipos[2]) allThirds.push({ ...g.equipos[2], grupo: g.grupo } as any);
      });
      allThirds.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);
      setThirds(allThirds);
    }
  }, [phase?.confirmedGroups, phase?.bracketLocked, standings, thirds.length]);

  const moveUp = (grupoIdx: number, teamIdx: number) => {
    if (teamIdx === 0) return;
    setStandings(prev => {
      const next = prev.map(g => ({ ...g, equipos: [...g.equipos] }));
      const g = next[grupoIdx].equipos;
      [g[teamIdx - 1], g[teamIdx]] = [g[teamIdx], g[teamIdx - 1]];
      return next;
    });
  };

  const moveDown = (grupoIdx: number, teamIdx: number) => {
    setStandings(prev => {
      const next = prev.map(g => ({ ...g, equipos: [...g.equipos] }));
      const g = next[grupoIdx].equipos;
      if (teamIdx >= g.length - 1) return next;
      [g[teamIdx], g[teamIdx + 1]] = [g[teamIdx + 1], g[teamIdx]];
      return next;
    });
  };

  const moveThirdUp = (idx: number) => {
    if (idx === 0) return;
    setThirds(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveThirdDown = (idx: number) => {
    if (idx === thirds.length - 1) return;
    setThirds(prev => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleConfirmGroup = async (grupo: string, equipos: TeamStat[]) => {
    if (!window.confirm(`¿Confirmar el Grupo ${grupo}? El 1º y 2º irán a las llaves eliminatorias.`)) return;
    
    setIsConfirming(grupo);
    setError(null);
    try {
      const res = await apiFetch('/bracket/confirm-group', {
        method: 'POST',
        token: accessToken,
        body: { leagueId: league.id, grupo, equipos },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Grupo ${grupo} confirmado.`);
        await loadPhase();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || `Error al confirmar grupo ${grupo}`);
      }
    } catch { setError('Error de conexión'); }
    setIsConfirming(null);
  };

  const handleConfirmThirds = async () => {
    if (!window.confirm('¿Confirmar los mejores terceros y bloquear el bracket final?')) return;
    
    setIsConfirming('thirds');
    setError(null);
    try {
      const best8 = thirds.slice(0, 8).map(t => t.equipo);
      const res = await apiFetch('/bracket/confirm-thirds', {
        method: 'POST',
        token: accessToken,
        body: { leagueId: league.id, bestThirds: best8 },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Bracket bloqueado! Las llaves completas están disponibles.');
        await loadPhase();
        onBracketConfirmed();
      } else {
        setError(data.error || 'Error al confirmar terceros');
      }
    } catch { setError('Error de conexión'); }
    setIsConfirming(null);
  };

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
          Las llaves eliminatorias ya están activas y completas.
        </p>
      </div>
    );
  }

  const allConfirmed = phase?.confirmedGroups?.length === 12;

  return (
    <div className="space-y-5">
      {/* Botón recargar */}
      <div className="flex justify-end">
        <button
          onClick={loadPreview}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Recargar
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

      {/* Mejores Terceros Interface */}
      {allConfirmed && !phase?.bracketLocked && thirds.length > 0 && (
        <div className="border-2 border-accent rounded-xl overflow-hidden shadow-md">
          <div className="bg-accent text-accent-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="font-bold">Resolución de Mejores Terceros</span>
            </div>
          </div>
          <div className="p-4 bg-accent/5">
            <p className="text-sm text-muted-foreground mb-4">
              Todos los grupos han sido confirmados. Ahora debes seleccionar y ordenar a los 8 mejores terceros.
              El orden es importante porque define contra qué 1er lugar juegan. Usa las flechas para resolver empates manualmente (ej. Fair Play o Sorteo).
            </p>
            
            <div className="space-y-2 bg-white rounded-lg border border-border p-2">
              {thirds.map((t: any, i) => {
                const isClasificado = i < 8;
                return (
                  <div key={t.equipo} className={`flex items-center justify-between p-2 rounded-lg border-2 ${isClasificado ? 'border-secondary/30 bg-secondary/5' : 'border-border/50 bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isClasificado ? 'bg-secondary text-white' : 'bg-muted-foreground text-white'}`}>
                        {i + 1}
                      </div>
                      <CountryFlag country={t.equipo} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{t.equipo} <span className="text-muted-foreground font-normal text-xs">(G. {t.grupo})</span></span>
                        <span className="text-[10px] text-muted-foreground">{t.pts} pts | {t.dif > 0 ? `+${t.dif}` : t.dif} dif | {t.gf} gf</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase ${isClasificado ? 'text-secondary' : 'text-muted-foreground'}`}>
                        {isClasificado ? 'Clasifica' : 'Eliminado'}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => moveThirdUp(i)} disabled={i === 0} className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-white transition-all disabled:opacity-30">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveThirdDown(i)} disabled={i === thirds.length - 1} className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-white transition-all disabled:opacity-30">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={handleConfirmThirds}
              disabled={isConfirming === 'thirds'}
              className="mt-4 w-full py-3 bg-accent text-accent-foreground font-bold rounded-lg flex justify-center items-center gap-2 hover:bg-accent/90 shadow-md transition-all disabled:opacity-50"
            >
              {isConfirming === 'thirds' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              Confirmar Terceros y Bloquear Bracket
            </button>
          </div>
        </div>
      )}

      {/* Lista de Grupos */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {standings.map((group, gi) => {
            const isConfirmed = phase?.confirmedGroups?.includes(group.grupo);
            const isFinished = group.equipos.filter(e => e.pj > 0).length === 4 && group.equipos.reduce((a, e) => a + e.pj, 0) === 12;

            return (
              <div key={group.grupo} className={`border-2 rounded-xl overflow-hidden transition-all ${isConfirmed ? 'border-secondary/40' : 'border-border'}`}>
                <button
                  onClick={() => setExpandedGroup(expandedGroup === group.grupo ? null : group.grupo)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${isConfirmed ? 'bg-secondary/10 hover:bg-secondary/20' : 'bg-muted hover:bg-muted/80'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isConfirmed ? 'text-secondary' : 'text-primary'}`}>GRUPO {group.grupo}</span>
                    {isConfirmed ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-secondary"><Check className="w-3 h-3"/> Confirmado</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isFinished ? '• Listo para confirmar' : `• ${group.equipos.reduce((a, e) => a + e.pj, 0) / 2}/6 partidos`}
                      </span>
                    )}
                  </div>
                  {expandedGroup === group.grupo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedGroup === group.grupo && (
                  <div className="bg-white">
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
                        <div key={team.equipo} className={`grid grid-cols-[auto_1fr_repeat(7,_auto)_auto] gap-x-2 items-center px-3 py-2 border-b border-border/40 last:border-0 ${
                          isQ1 ? 'bg-secondary/8' : isQ2 ? 'bg-secondary/4' : isQ3 ? 'bg-accent/5' : ''
                        }`}>
                          <div className="flex items-center gap-1 w-4">
                            <span className={`text-xs font-bold ${isQ1 ? 'text-secondary' : isQ2 ? 'text-secondary/80' : isQ3 ? 'text-accent' : 'text-muted-foreground'}`}>{ti + 1}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CountryFlag country={team.equipo} size="xs" />
                            <span className="text-xs font-bold truncate">{team.equipo}</span>
                          </div>
                          <span className="text-xs text-center text-muted-foreground w-6">{team.pj}</span>
                          <span className="text-xs text-center text-muted-foreground w-6">{team.pg}</span>
                          <span className="text-xs text-center text-muted-foreground w-6">{team.pe}</span>
                          <span className="text-xs text-center text-muted-foreground w-6">{team.pp}</span>
                          <span className="text-xs text-center text-muted-foreground w-8">{team.gf}</span>
                          <span className="text-xs text-center text-muted-foreground w-8">{team.gc}</span>
                          <span className="text-xs text-center font-bold w-8 text-muted-foreground">{team.dif > 0 ? `+${team.dif}` : team.dif}</span>
                          <span className="text-sm font-bold text-primary text-center w-8">{team.pts}</span>
                        </div>
                      );
                    })}

                    {!isConfirmed && (
                      <div className="p-3 bg-muted/10 border-t border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex gap-2">
                          {group.equipos.map((t, ti) => (
                            <div key={t.equipo} className="flex gap-1">
                              <button onClick={() => moveUp(gi, ti)} disabled={ti === 0} className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-white disabled:opacity-20"><ArrowUp className="w-3 h-3"/></button>
                              <button onClick={() => moveDown(gi, ti)} disabled={ti === 3} className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-white disabled:opacity-20"><ArrowDown className="w-3 h-3"/></button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleConfirmGroup(group.grupo, group.equipos)}
                          disabled={!isFinished || isConfirming === group.grupo}
                          className="px-4 py-2 bg-secondary text-white font-bold text-xs rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isConfirming === group.grupo ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                          Confirmar Grupo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
