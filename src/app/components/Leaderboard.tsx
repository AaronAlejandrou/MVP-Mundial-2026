import { TrendingUp, TrendingDown, Trophy, Medal, Crown, Award } from 'lucide-react';

interface LeaderboardPlayer {
  id: string;
  nombre: string;
  avatar_url?: string;
  puntaje_total: number;
  posicion_anterior?: number;
}

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  currentUserId?: string;
}

export function Leaderboard({ players, currentUserId }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.puntaje_total - a.puntaje_total);

  const getPositionChange = (currentPos: number, player: LeaderboardPlayer) => {
    if (!player.posicion_anterior) return null;
    const change = player.posicion_anterior - currentPos;
    return change;
  };

  const getPositionDisplay = (position: number) => {
    switch (position) {
      case 1:
        return {
          icon: <Crown className="w-7 h-7" style={{ color: '#FFD700' }} />,
          bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.15))',
          border: '#FFD700'
        };
      case 2:
        return {
          icon: <Medal className="w-6 h-6" style={{ color: '#C0C0C0' }} />,
          bg: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(158, 158, 158, 0.15))',
          border: '#C0C0C0'
        };
      case 3:
        return {
          icon: <Medal className="w-6 h-6" style={{ color: '#CD7F32' }} />,
          bg: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.15))',
          border: '#CD7F32'
        };
      default:
        return {
          icon: <span className="text-lg font-bold text-muted-foreground">#{position}</span>,
          bg: 'transparent',
          border: 'transparent'
        };
    }
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
    <div className="relative">
      {/* Main Card */}
      <div className="relative bg-white rounded-2xl shadow-mundial-lg border-2 border-border overflow-hidden">
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-4 sm:py-6 border-b-2 border-border bg-muted"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient-mundial mb-1">Clasificación</h2>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {sortedPlayers.length} participante{sortedPlayers.length !== 1 ? 's' : ''} • Mundial 2026
              </p>
            </div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-md bg-primary flex-shrink-0"
            >
              <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
          {sortedPlayers.map((player, index) => {
            const position = index + 1;
            const positionChange = getPositionChange(position, player);
            const isCurrentUser = player.id === currentUserId;
            const positionStyle = getPositionDisplay(position);

            return (
              <div
                key={player.id}
                className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300 border-2 ${
                  isCurrentUser
                    ? 'shadow-mundial scale-[1.02]'
                    : 'hover:scale-[1.01] shadow-sm'
                }`}
                style={{
                  background: isCurrentUser
                    ? 'var(--blob-purple)'
                    : position <= 3
                    ? positionStyle.bg
                    : 'white',
                  borderColor: isCurrentUser
                    ? 'var(--primary)'
                    : position <= 3
                    ? positionStyle.border
                    : 'var(--border)'
                }}
              >
                {/* Position */}
                <div className="flex items-center justify-center w-12">
                  {positionStyle.icon}
                </div>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.nombre}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-3 shadow-md"
                      style={{ borderColor: position <= 3 ? positionStyle.border : 'white' }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-base font-bold border-3 shadow-md"
                      style={{
                        background:
                          position === 1
                            ? 'linear-gradient(135deg, #FFD700, #FFA000)'
                            : position === 2
                            ? 'linear-gradient(135deg, #C0C0C0, #9E9E9E)'
                            : position === 3
                            ? 'linear-gradient(135deg, #CD7F32, #B87333)'
                            : 'var(--gradient-primary)',
                        color: 'white',
                        borderColor: position <= 3 ? positionStyle.border : 'var(--primary)'
                      }}
                    >
                      {getAvatarInitials(player.nombre)}
                    </div>
                  )}

                  {/* Position Change Badge */}
                  {positionChange !== null && positionChange !== 0 && (
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white ${
                        positionChange > 0
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {positionChange > 0 ? (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      ) : (
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-foreground truncate text-base sm:text-lg">
                      {player.nombre}
                    </h3>
                    {isCurrentUser && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground"
                      >
                        TÚ
                      </span>
                    )}
                    {position <= 3 && (
                      <Award className="w-4 h-4" style={{ color: positionStyle.border }} />
                    )}
                  </div>
                  {positionChange !== null && (
                    <p className="text-xs font-medium text-muted-foreground">
                      {positionChange > 0
                        ? `↑ Subió ${positionChange} posicion${positionChange !== 1 ? 'es' : ''}`
                        : positionChange < 0
                        ? `↓ Bajó ${Math.abs(positionChange)} posicion${Math.abs(positionChange) !== 1 ? 'es' : ''}`
                        : '→ Sin cambios'}
                    </p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-score text-3xl sm:text-4xl font-bold leading-none mb-1"
                    style={{
                      color: position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : position === 3 ? '#CD7F32' : 'var(--primary)'
                    }}
                  >
                    {player.puntaje_total}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">pts</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedPlayers.length === 0 && (
          <div className="py-16 text-center px-6">
            <Trophy className="w-20 h-20 mx-auto mb-4 opacity-30 text-primary" />
            <p className="text-muted-foreground text-xl font-bold mb-2">
              No hay participantes aún
            </p>
            <p className="text-muted-foreground text-sm">
              Invita a tus amigos para comenzar la competencia
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
