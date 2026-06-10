import { useState } from 'react';
import { TrendingUp, TrendingDown, Trophy, ChevronRight, Share2, Check, Users, FileText } from 'lucide-react';
import { TermsModal } from './TermsModal';

interface LeaderboardPlayer {
  id: string;
  nombre: string;
  avatar_url?: string;
  puntaje_total: number;
  posicion_anterior?: number;
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
}

export function Leaderboard({ players, currentUserId, currentLeague }: LeaderboardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => b.puntaje_total - a.puntaje_total);

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

  const copyLink = async () => {
    const code = currentLeague?.invitationCode || currentLeague?.codigo_invitacion;
    if (!code) return;
    const link = `${window.location.origin}/?invite=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      {/* Main content starts directly */}

      {/* Cabecera minimalista y Premium */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-primary/80">
            <Trophy className="w-5 h-5" />
            <span className="font-bold uppercase tracking-widest text-xs">Ranking Oficial</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
            {currentLeague?.nombre || "Cargando Liga..."}
          </h2>
          <div className="flex items-center gap-4 mt-4">
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
        
        {/* Botones Invitar + Bases */}
        {(currentLeague?.invitationCode || currentLeague?.codigo_invitacion) && (
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={() => setShowTerms(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-105 border border-border/60"
            >
              <FileText className="w-4 h-4" />
              Ver Bases
            </button>
            <button
              onClick={copyLink}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                copiedLink
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-105'
                  : 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-primary/20 shadow-lg'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Enlace copiado!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Invitar Amigos
                </>
              )}
            </button>
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Código: <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">{currentLeague.invitationCode || currentLeague.codigo_invitacion}</span>
            </span>
          </div>
        )}
      </div>

      {/* Premio acumulado */}
      {sortedPlayers.length > 0 && (() => {
        const pool = sortedPlayers.length * 20;
        const first = Math.round(pool * 0.70);
        const second = Math.round(pool * 0.30);
        return (
          <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-2xl border border-amber-500/25 bg-card/80 dark:bg-gradient-to-r dark:from-amber-500/8 dark:via-card/60 dark:to-primary/8 backdrop-blur-xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(245,158,11,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Izquierda: total */}
              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">Premio Acumulado</p>
                <p className="text-5xl sm:text-6xl font-black tracking-tighter leading-none mt-1">
                  <span className="text-foreground">S/ </span>
                  <span className="text-amber-500 dark:text-amber-400">{pool.toLocaleString('es-PE')}</span>
                </p>
              </div>
              {/* Derecha: desglose */}
              <div className="flex gap-2 sm:flex-col sm:gap-2 sm:items-end">
                <div className="flex-1 sm:flex-none flex sm:flex-row-reverse items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">S/ {first.toLocaleString('es-PE')}</p>
                    <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider mt-0.5">1.er Puesto · 70%</p>
                  </div>
                  <span className="text-2xl leading-none">🥇</span>
                </div>
                <div className="flex-1 sm:flex-none flex sm:flex-row-reverse items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-400/10 border border-slate-400/25">
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-black text-slate-600 dark:text-slate-300 leading-none">S/ {second.toLocaleString('es-PE')}</p>
                    <p className="text-[10px] font-bold text-slate-500/70 uppercase tracking-wider mt-0.5">2.do Puesto · 30%</p>
                  </div>
                  <span className="text-2xl leading-none">🥈</span>
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
                className={`group relative flex items-center p-4 sm:p-5 transition-all duration-500 ease-out rounded-3xl ${
                  isCurrentUser
                    ? 'bg-card/80 backdrop-blur-2xl border-2 border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.08)] scale-[1.01] z-10'
                    : 'bg-card/40 backdrop-blur-xl border border-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:bg-card/70 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:scale-[1.005]'
                }`}
              >
                
                {/* Indicador de Posición */}
                <div className={`w-12 sm:w-16 flex-shrink-0 flex justify-center items-center font-score text-3xl sm:text-4xl font-black tracking-tighter ${rankColor}`}>
                  {position}
                </div>

                {/* Contenedor Avatar */}
                <div className="relative mr-4 sm:mr-6 flex-shrink-0">
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

                  {/* Badge de tendencia (Subió/Bajó) - Posicionado como un micro-detalle */}
                  {positionChange !== null && positionChange !== 0 && (
                    <div
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border-2 border-white backdrop-blur-md ${
                        positionChange > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      {positionChange > 0 ? (
                        <TrendingUp className="w-3 h-3 text-white" strokeWidth={3} />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                  )}
                </div>

                {/* Información Principal */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
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
                  
                  {/* Detalle de tendencia en texto muy sutil */}
                  {positionChange !== null && positionChange !== 0 && (
                    <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-0.5">
                      {positionChange > 0
                        ? `↑ Subió ${positionChange} lugar${positionChange > 1 ? 'es' : ''}`
                        : `↓ Bajó ${Math.abs(positionChange)} lugar${Math.abs(positionChange) > 1 ? 'es' : ''}`}
                    </p>
                  )}
                </div>

                {/* Puntaje */}
                <div className="flex-shrink-0 text-right ml-4 flex flex-col justify-center items-end">
                  <div className={`font-score text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-none ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
