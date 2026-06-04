import { CountryFlag } from './CountryFlag';
import { TeamStanding } from '../../data/groupStandingsData';

interface GroupTableProps {
  grupo: string;
  equipos: TeamStanding[];
  highlightTeam?: string;
  compact?: boolean;
}

export function GroupTable({ grupo, equipos, highlightTeam, compact = false }: GroupTableProps) {
  // Ordenar equipos por: puntos desc, diferencia desc, goles favor desc
  const sortedTeams = [...equipos].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    return b.gf - a.gf;
  });

  const getPositionColor = (index: number) => {
    if (index < 2) return 'bg-secondary/10 border-l-4 border-l-secondary'; // Clasifican directo
    if (index === 2) return 'bg-accent/10 border-l-4 border-l-accent'; // Posible 3º lugar
    return ''; // Eliminado
  };

  return (
    <div className={`bg-white rounded-xl border-2 border-border overflow-hidden shadow-mundial ${compact ? '' : ''}`}>
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-primary text-primary-foreground flex items-center justify-between">
        <h3 className={`font-bold ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
          Grupo {grupo}
        </h3>
        <div className={`px-2 py-1 rounded-full bg-primary-foreground/20 ${compact ? 'text-xs' : 'text-xs sm:text-sm'} font-bold`}>
          {equipos[0]?.pj || 0}/3 J
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted text-xs font-bold text-muted-foreground border-b border-border">
              <th className="text-left py-2 px-2 sm:px-3">#</th>
              <th className="text-left py-2 px-2 sm:px-3">Equipo</th>
              <th className="text-center py-2 px-1 sm:px-2">PJ</th>
              <th className="text-center py-2 px-1 sm:px-2 hidden sm:table-cell">G</th>
              <th className="text-center py-2 px-1 sm:px-2 hidden sm:table-cell">E</th>
              <th className="text-center py-2 px-1 sm:px-2 hidden sm:table-cell">P</th>
              <th className="text-center py-2 px-1 sm:px-2">GF</th>
              <th className="text-center py-2 px-1 sm:px-2">GC</th>
              <th className="text-center py-2 px-1 sm:px-2">DIF</th>
              <th className="text-center py-2 px-2 sm:px-3 font-bold text-primary">PTS</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <tr
                key={team.equipo}
                className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${getPositionColor(index)} ${
                  highlightTeam === team.equipo ? 'bg-primary/5' : ''
                }`}
              >
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  <span className={`font-bold text-xs sm:text-sm ${
                    index < 2 ? 'text-secondary' : index === 2 ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  <div className="flex items-center gap-2">
                    <CountryFlag country={team.equipo} size="sm" />
                    <span className={`font-bold text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none ${
                      highlightTeam === team.equipo ? 'text-primary' : 'text-foreground'
                    }`}>
                      {team.equipo}
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium">
                  {team.pj}
                </td>
                <td className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium hidden sm:table-cell">
                  {team.pg}
                </td>
                <td className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium hidden sm:table-cell">
                  {team.pe}
                </td>
                <td className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium hidden sm:table-cell">
                  {team.pp}
                </td>
                <td className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium">
                  {team.gf}
                </td>
                <td className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium">
                  {team.gc}
                </td>
                <td className={`text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold ${
                  team.dif > 0 ? 'text-secondary' : team.dif < 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {team.dif > 0 ? `+${team.dif}` : team.dif}
                </td>
                <td className="text-center py-2 sm:py-3 px-2 sm:px-3">
                  <span className="font-score text-base sm:text-lg font-bold text-primary">
                    {team.pts}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="px-3 sm:px-4 py-2 bg-muted/50 border-t border-border">
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-secondary" />
              <span className="text-muted-foreground">Clasifican</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-accent" />
              <span className="text-muted-foreground">Posible 3º</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
