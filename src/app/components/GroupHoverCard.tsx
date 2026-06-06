import { CountryFlag } from './CountryFlag';
import { GROUP_STANDINGS } from '../../data/groupStandingsData';

interface GroupHoverCardProps {
  grupo: string;
}

export function GroupHoverCard({ grupo }: GroupHoverCardProps) {
  const groupData = GROUP_STANDINGS.find(g => g.grupo === grupo);

  if (!groupData) {
    return (
      <div className="bg-card rounded-lg border-2 border-border p-3 shadow-mundial-lg">
        <p className="text-xs text-muted-foreground">Grupo no encontrado</p>
      </div>
    );
  }

  // Ordenar equipos
  const sortedTeams = [...groupData.equipos].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    return b.gf - a.gf;
  });

  return (
    <div className="bg-card rounded-lg border-2 border-primary shadow-mundial-lg min-w-[280px]">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-3 py-2">
        <h3 className="font-bold text-sm">Grupo {grupo}</h3>
      </div>

      {/* Mini Table */}
      <div className="p-2">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left py-1 px-1">#</th>
              <th className="text-left py-1 px-2">Equipo</th>
              <th className="text-center py-1 px-1">PJ</th>
              <th className="text-center py-1 px-1">DIF</th>
              <th className="text-center py-1 px-1 font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => {
              const isQualified = index < 2;
              const isThird = index === 2;

              return (
                <tr
                  key={team.equipo}
                  className={`border-b border-border/30 ${
                    isQualified
                      ? 'bg-secondary/10'
                      : isThird
                      ? 'bg-accent/10'
                      : ''
                  }`}
                >
                  <td className="py-1.5 px-1">
                    <span className={`text-xs font-bold ${
                      isQualified ? 'text-secondary' : isThird ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag country={team.equipo} size="sm" />
                      <span className="text-xs font-bold truncate max-w-[120px]">
                        {team.equipo}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-1.5 px-1 text-xs font-medium">
                    {team.pj}
                  </td>
                  <td className={`text-center py-1.5 px-1 text-xs font-bold ${
                    team.dif > 0 ? 'text-secondary' : team.dif < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {team.dif > 0 ? `+${team.dif}` : team.dif}
                  </td>
                  <td className="text-center py-1.5 px-1">
                    <span className="font-score text-sm font-bold text-primary">
                      {team.pts}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-muted px-3 py-2 border-t border-border">
        <p className="text-xs text-center text-muted-foreground font-medium">
          Click para ver tabla completa
        </p>
      </div>
    </div>
  );
}
