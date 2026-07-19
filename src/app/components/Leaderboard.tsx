import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, ChevronRight, Users, Crown, Medal, BarChart3, History, X } from 'lucide-react';
import { PlayerPredictionsModal } from './PlayerPredictionsModal';
import { MyStats } from './MyStats';
import { apiFetch } from '../../lib/api';

interface LeaderboardPlayer {
  id: string;
  nombre: string;
  avatar_url?: string;
  puntaje_total: number;
  posicion_anterior?: number;
  marcadores_exactos?: number;
}

interface League {
  id: string;
  nombre: string;
  invitationCode?: string;
  codigo_invitacion?: string;
}

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  currentUserId?: string;
  currentLeague?: League;
  accessToken?: string;
  knockoutTeams?: Record<number, { team1: string; team2: string }>;
  /** Partidos enriquecidos — para calcular cuántos quedan y los pts en juego. */
  matches?: any[];
}

/**
 * Overlay a pantalla completa con las stats de OTRO jugador: consulta sus
 * pronósticos bloqueados y reusa MyStats (mismo flujo de slides + resumen).
 */
function PlayerStatsOverlay({ player, leagueId, accessToken, players, matches, onClose }: {
  player: LeaderboardPlayer;
  leagueId: string;
  accessToken: string;
  players: LeaderboardPlayer[];
  matches: any[];
  onClose: () => void;
}) {
  const [preds, setPreds] = useState<Record<number, { goles_a: number; goles_b: number; puntos_obtenidos?: number }> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/player-predictions/locked?userId=${player.id}&leagueId=${leagueId}`, { token: accessToken });
        if (res.ok) {
          const data = await res.json();
          const rec: Record<number, any> = {};
          (data.predictions || []).forEach((p: any) => {
            rec[p.matchId] = { goles_a: p.goles_a, goles_b: p.goles_b, puntos_obtenidos: p.puntos_obtenidos ?? undefined };
          });
          if (alive) setPreds(rec);
        } else if (alive) setPreds({});
      } catch { if (alive) setPreds({}); }
    })();
    return () => { alive = false; };
  }, [player.id, leagueId, accessToken]);

  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-y-auto">
      <button
        onClick={onClose}
        aria-label="Cerrar stats"
        className="fixed top-4 right-4 z-[80] w-10 h-10 rounded-full bg-muted/90 border border-border text-foreground flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      {preds === null ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-16">
          <MyStats
            userName={player.nombre}
            predictions={preds}
            matches={matches}
            leaderboard={players}
            currentUserId={player.id}
            leagueId={leagueId}
            accessToken={accessToken}
          />
        </div>
      )}
    </div>
  );
}

export function Leaderboard({ players, currentUserId, currentLeague, accessToken, knockoutTeams, matches }: LeaderboardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);
  // Flujo post-final: al tocar un jugador se elige entre "Ver stats" e "Historial".
  const [chooserPlayer, setChooserPlayer] = useState<LeaderboardPlayer | null>(null);
  const [statsPlayer, setStatsPlayer] = useState<LeaderboardPlayer | null>(null);
  const [seenRanking, setSeenRanking] = useState(() => localStorage.getItem('polla_seen_ranking') === '1');
  // Ceremonia de cierre: se muestra la primera vez que abres el Ranking.
  const [showCeremony, setShowCeremony] = useState(() => !localStorage.getItem('polla_ranking_ceremony_seen'));
  const [ceremonyClosing, setCeremonyClosing] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.puntaje_total !== a.puntaje_total) return b.puntaje_total - a.puntaje_total;
    return (b.marcadores_exactos ?? 0) - (a.marcadores_exactos ?? 0);
  });
  const entryFee = currentLeague?.id === 'b4e8efe1-6121-4b5e-a9b4-449572b79644' ? 50 : 20;
  const poolTotal = sortedPlayers.length * entryFee;
  const prizeFirst = Math.round(poolTotal * 0.70);
  const prizeSecond = Math.round(poolTotal * 0.30);

  // ¿La Gran Final (104) ya se jugó? Habilita el flujo post-final al tocar
  // un jugador: elegir entre "Ver stats" e "Historial".
  const finalDone = (matches ?? []).find((m: any) => m.id === 104)?.estado === 'finalizado';

  // Confeti dorado mientras la ceremonia está abierta (3 ráfagas).
  useEffect(() => {
    if (!showCeremony) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    (async () => {
      const confetti = (await import('canvas-confetti')).default;
      if (cancelled) return;
      const colors = ['#F1D07C', '#EAC65E', '#FFFFFF', '#B487E8', '#48E5C2'];
      [0, 650, 1400].forEach(delay => {
        timers.push(setTimeout(() => {
          const base = { colors, useWorker: false, disableForReducedMotion: true, zIndex: 70, ticks: 240, scalar: 0.95 };
          confetti({ ...base, particleCount: 70, spread: 82, startVelocity: 46, origin: { x: 0.5, y: 0.72 } });
          confetti({ ...base, particleCount: 38, angle: 60, origin: { x: 0.02, y: 0.9 } });
          confetti({ ...base, particleCount: 38, angle: 120, origin: { x: 0.98, y: 0.9 } });
        }, delay));
      });
    })();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [showCeremony]);

  const closeCeremony = () => {
    setCeremonyClosing(true);
    setTimeout(() => {
      localStorage.setItem('polla_ranking_ceremony_seen', '1');
      setShowCeremony(false);
      setCeremonyClosing(false);
    }, 500);
  };

  const getPositionChange = (currentPos: number, player: LeaderboardPlayer) => {
    if (!player.posicion_anterior) return null;
    return player.posicion_anterior - currentPos;
  };

  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto py-4 sm:py-12 px-4 sm:px-6">

      {/* ── Ceremonia de cierre del Mundial ── */}
      {showCeremony && sortedPlayers.length > 0 && (
        <div className={`rank-ceremony ${ceremonyClosing ? 'rank-ceremony-out' : ''}`}>
          <div className="fi-aurora" aria-hidden="true" />
          <div className="fi-dust" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center w-full max-w-md">
            <div className="ms-rise flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/60" style={{ animationDelay: '0s' }}>
              <Trophy className="w-3.5 h-3.5 text-[#F1D07C]" />
              Mundial 2026 · Cierre
            </div>
            <h1 className="ms-rise fi-title font-score text-5xl sm:text-6xl font-bold leading-none" style={{ animationDelay: '0.08s' }}>
              GRACIAS<br />POR JUGAR
            </h1>
            <p className="ms-rise text-sm font-bold text-white/70" style={{ animationDelay: '0.2s' }}>
              El Mundial 2026 llega a su fin
            </p>
            <p className="ms-rise text-lg font-black text-gradient-mundial" style={{ animationDelay: '0.28s' }}>
              {currentLeague?.nombre || 'Tu Liga'}
            </p>

            {/* Pozo */}
            <div className="ms-rise w-full rounded-2xl border border-[#F1D07C]/30 bg-white/5 p-4 mt-1" style={{ animationDelay: '0.4s' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Premio acumulado</p>
              <p className="font-score text-5xl font-bold text-[#F1D07C] leading-none mt-0.5">S/ {poolTotal.toLocaleString('es-PE')}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl bg-[#F1D07C]/10 border border-[#F1D07C]/25 py-2.5 flex flex-col items-center">
                  <Crown className="w-4 h-4 text-[#F1D07C]" fill="currentColor" fillOpacity={0.25} />
                  <p className="font-score text-xl font-bold text-[#F1D07C] mt-0.5">S/ {prizeFirst.toLocaleString('es-PE')}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">1.er · 70%</p>
                </div>
                <div className="rounded-xl bg-white/8 border border-white/15 py-2.5 flex flex-col items-center">
                  <Medal className="w-4 h-4 text-white/70" />
                  <p className="font-score text-xl font-bold text-white/90 mt-0.5">S/ {prizeSecond.toLocaleString('es-PE')}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">2.do · 30%</p>
                </div>
              </div>
            </div>


            <button
              onClick={closeCeremony}
              className="ms-rise fi-next mt-2 px-7 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95"
              style={{ animationDelay: '0.7s' }}
            >
              Ver la tabla final →
            </button>
          </div>

          {/* Créditos — pegados al fondo, Sergio no se mueve, Aaron justo al medio con el navbar de forma responsive */}
          <div className="ms-rise absolute left-0 right-0 flex justify-center pointer-events-none" 
               style={{ bottom: 'calc(130px + env(safe-area-inset-bottom))', animationDelay: '0.55s' }}>
            <span className="text-xs font-bold text-white/70">Sergio Torres · Carlos Trejo</span>
          </div>
          <div className="ms-rise absolute left-0 right-0 flex justify-center pointer-events-none" 
               style={{ bottom: 'calc(97px + env(safe-area-inset-bottom))', animationDelay: '0.6s' }}>
            <span className="text-xs font-bold text-white/70">Aaron</span>
          </div>
        </div>
      )}

      {selectedPlayer && currentLeague && accessToken && (
        <PlayerPredictionsModal
          player={selectedPlayer}
          leagueId={currentLeague.id}
          accessToken={accessToken}
          currentUserId={currentUserId}
          knockoutTeams={knockoutTeams}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Selector post-final: Ver stats o Historial */}
      {chooserPlayer && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" onClick={() => setChooserPlayer(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="ms-rise relative w-full max-w-sm bg-card border border-border rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-center font-black text-foreground text-lg mb-1">{chooserPlayer.nombre}</p>
            <p className="text-center text-xs font-medium text-muted-foreground mb-4">¿Qué quieres ver?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setStatsPlayer(chooserPlayer); setChooserPlayer(null); }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-primary/10 border border-primary/25 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                Ver stats
              </button>
              <button
                onClick={() => { setSelectedPlayer(chooserPlayer); setChooserPlayer(null); }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm hover:bg-muted/70 transition-colors"
              >
                <History className="w-5 h-5" />
                Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats de otro jugador (mismo flujo de Mis Stats) */}
      {statsPlayer && currentLeague && accessToken && (
        <PlayerStatsOverlay
          player={statsPlayer}
          leagueId={currentLeague.id}
          accessToken={accessToken}
          players={sortedPlayers}
          matches={matches ?? []}
          onClose={() => setStatsPlayer(null)}
        />
      )}

      {/* Main content starts directly */}

      {/* Cabecera minimalista y Premium */}
      <div className="ms-rise flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-12 gap-3 sm:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 text-primary/80">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-bold uppercase tracking-widest text-[11px] sm:text-xs">Ranking Oficial</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-gradient-mundial leading-tight">
            {currentLeague?.nombre || "Cargando Liga..."}
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 mt-2.5 sm:mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-muted-foreground font-medium text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span>{sortedPlayers.length} competidores</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg font-bold text-xs sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              En Curso
            </div>
          </div>
        </div>
      </div>

      {/* Premio acumulado */}
      {sortedPlayers.length > 0 && (() => {
        const pool = sortedPlayers.length * entryFee;
        const first = Math.round(pool * 0.70);
        const second = Math.round(pool * 0.30);
        return (
          <div className="ms-rise mb-4 sm:mb-8 relative overflow-hidden rounded-2xl border border-amber-500/25 bg-card/80 dark:bg-gradient-to-r dark:from-amber-500/8 dark:via-card/60 dark:to-primary/8 backdrop-blur-xl p-3.5 sm:p-5 shadow-[0_4px_24px_rgba(245,158,11,0.08)]" style={{ animationDelay: '0.08s' }}>
            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Izquierda: total */}
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-0.5 sm:mb-1">Premio Acumulado</p>
                <p className="text-[2.5rem] sm:text-6xl font-black tracking-tighter leading-none">
                  <span className="text-foreground">S/ </span>
                  <span className="text-amber-500 dark:text-amber-400">{pool.toLocaleString('es-PE')}</span>
                </p>
              </div>
              {/* Derecha: desglose — en móvil apilado a ancho completo (medalla izq.,
                  monto/label a la derecha, sin partir texto); en desktop igual que antes. */}
              <div className="flex flex-col gap-1.5 flex-shrink-0 sm:gap-2 sm:items-end">
                <div className="flex items-center gap-1.5 sm:gap-3 px-2 py-1 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/25 sm:flex-row-reverse">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" fillOpacity={0.25} strokeWidth={2} />
                  </span>
                  <div className="sm:text-right">
                    <p className="text-sm sm:text-2xl font-black text-amber-600 dark:text-amber-400 leading-none whitespace-nowrap">S/ {first.toLocaleString('es-PE')}</p>
                    <p className="text-[8px] sm:text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                      <span className="sm:hidden">70%</span>
                      <span className="hidden sm:inline">1.er Puesto · 70%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 px-2 py-1 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-400/10 border border-slate-400/25 sm:flex-row-reverse">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-slate-400/15 flex items-center justify-center">
                    <Medal className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-400" strokeWidth={2.25} />
                  </span>
                  <div className="sm:text-right">
                    <p className="text-sm sm:text-2xl font-black text-slate-600 dark:text-slate-300 leading-none whitespace-nowrap">S/ {second.toLocaleString('es-PE')}</p>
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-500/70 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                      <span className="sm:hidden">30%</span>
                      <span className="hidden sm:inline">2.do Puesto · 30%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lista Glassmorphism Real */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {sortedPlayers.length === 0 ? (
          <div className="bg-card/40 backdrop-blur-2xl border border-border/60 rounded-[2rem] p-16 text-center shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-semibold text-lg">La tabla está vacía</p>
          </div>
        ) : (
          sortedPlayers.map((player, index) => {
            const position = index + 1;
            const positionChange = getPositionChange(position, player);
            const isCurrentUser = player.id === currentUserId;
            
            // Estilos dinámicos según posición
            const isTop1 = position === 1;
            const isTop2 = position === 2;
            const isTop3 = position === 3;

            let rankColor = "text-muted-foreground/30";
            if (isTop1) rankColor = "text-amber-400";
            if (isTop2) rankColor = "text-slate-400";
            if (isTop3) rankColor = "text-amber-700/60";

            return (
              <div
                key={player.id}
                style={{ animationDelay: `${Math.min(index * 0.06, 0.6)}s` }}
                onClick={() => {
                  if (finalDone) setChooserPlayer(player);
                  else setSelectedPlayer(player);
                  if (!seenRanking) { localStorage.setItem('polla_seen_ranking', '1'); setSeenRanking(true); }
                }}
                className={`ms-rise group relative flex items-center p-4 sm:p-5 transition-all duration-500 ease-out rounded-3xl cursor-pointer ${
                  isTop1
                    ? 'rank-card-gold bg-gradient-to-br from-amber-500/15 via-card/70 to-amber-400/5 backdrop-blur-2xl border-2 border-amber-400/40 hover:-translate-y-0.5 hover:scale-[1.015] z-10'
                    : isTop2
                    ? 'rank-card-silver bg-gradient-to-br from-slate-400/15 via-card/70 to-slate-300/5 backdrop-blur-2xl border-2 border-slate-300/40 hover:-translate-y-0.5 hover:scale-[1.015] z-10'
                    : isCurrentUser
                    ? 'bg-card/80 backdrop-blur-2xl border-2 border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.08)] scale-[1.01] z-10'
                    : 'bg-card/40 backdrop-blur-xl border border-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:bg-card/70 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:scale-[1.005]'
                }`}
              >
                {!seenRanking && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse pointer-events-none z-20" />
                )}

                {/* Marca de agua decorativa (detrás del contenido) para 1er/2do lugar */}
                {(isTop1 || isTop2) && (
                  <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none rotate-12 opacity-[0.06] -z-10">
                    {isTop1
                      ? <Crown className="w-20 h-20 sm:w-28 sm:h-28 text-amber-400" fill="currentColor" />
                      : <Medal className="w-20 h-20 sm:w-28 sm:h-28 text-slate-300" fill="currentColor" />}
                  </div>
                )}

                {/* Indicador de Posición */}
                <div className={`w-9 sm:w-16 flex-shrink-0 flex justify-center items-center font-score text-2xl sm:text-4xl font-black tracking-tighter ${rankColor} ${
                  isTop1 ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]' : isTop2 ? 'drop-shadow-[0_0_9px_rgba(148,163,184,0.5)]' : ''
                }`}>
                  {position}
                </div>

                {/* Contenedor Avatar — oculto en móvil (no aporta y roba espacio al nombre) */}
                <div className="relative hidden sm:block sm:mr-6 flex-shrink-0">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.nombre}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] object-cover shadow-sm ring-1 ring-slate-900/5"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] flex items-center justify-center text-lg sm:text-xl font-bold shadow-sm ring-1 ring-border/50 ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {getAvatarInitials(player.nombre)}
                    </div>
                  )}

                </div>

                {/* Información Principal */}
                <div className="flex-1 min-w-0 flex flex-col justify-center ml-3 sm:ml-0">
                  <div className="flex items-center gap-3">
                    <h3 className={`font-bold text-lg sm:text-xl truncate tracking-tight ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {player.nombre}
                    </h3>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary uppercase tracking-widest">
                        Tú
                      </span>
                    )}
                  </div>
                  
                  {/* Exactos (criterio de desempate) */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[11px] font-medium ${
                      (player.marcadores_exactos ?? 0) > 0
                        ? 'text-amber-500/50'
                        : 'text-muted-foreground/30'
                    }`}>
                      Marcadores exactos: {player.marcadores_exactos ?? 0}
                    </span>
                  </div>
                </div>

                {/* Movimiento respecto al último partido */}
                {positionChange !== null && positionChange !== 0 && (
                  <div className={`flex-shrink-0 flex items-center gap-0.5 sm:gap-1 mr-2 sm:mr-5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl ${
                    positionChange > 0
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {positionChange > 0
                      ? <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={2.5} />
                      : <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={2.5} />}
                    <span className="font-bold text-xs sm:text-base">{Math.abs(positionChange)}</span>
                  </div>
                )}

                {/* Puntaje */}
                <div className="flex-shrink-0 text-right ml-2 sm:ml-4 flex flex-col justify-center items-end">
                  <div className={`font-score text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-none ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                    {player.puntaje_total}
                  </div>
                  <div className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
                    Puntos
                  </div>
                </div>

                {/* Ícono de flecha sutil a la derecha, indicando que se podría abrir perfil (simulado estético) */}
                <div className="hidden sm:flex ml-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ChevronRight className="w-6 h-6 text-muted-foreground/30" />
                </div>

                {/* Barrido de luz (shine) que cruza la card en hover — solo 1er/2do lugar */}
                {(isTop1 || isTop2) && <span className="rank-shine" aria-hidden="true" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
