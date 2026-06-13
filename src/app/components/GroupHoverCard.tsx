import { CountryFlag } from './CountryFlag';
import { GROUP_STANDINGS } from '../../data/groupStandingsData';

interface Match {
  equipo_a: string;
  equipo_b: string;
  grupo: string;
  goles_a?: number | null;
  goles_b?: number | null;
  estado?: string;
}

interface GroupHoverCardProps {
  grupo: string;
  allMatches?: Match[];
}

export function GroupHoverCard({ grupo, allMatches = [] }: GroupHoverCardProps) {
  const groupData = GROUP_STANDINGS.find(g => g.grupo === grupo);

  if (!groupData) {
    return (
      <div className="bg-card rounded-lg border-2 border-border p-3 shadow-mundial-lg">
        <p className="text-xs text-muted-foreground">Grupo no encontrado</p>
      </div>
    );
  }

  // Calcular standings reales desde partidos finalizados
  const statsMap: Record<string, { pj: number; gf: number; gc: number; dif: number; pts: number }> = {};

  for (const team of groupData.equipos) {
    statsMap[team.equipo] = { pj: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
  }

  const finished = allMatches.filter(m => m.grupo === grupo && m.estado === 'finalizado');
  for (const m of finished) {
    const ga = m.goles_a ?? 0;
    const gb = m.goles_b ?? 0;
    if (statsMap[m.equipo_a]) {
      statsMap[m.equipo_a].pj += 1;
      statsMap[m.equipo_a].gf += ga;
      statsMap[m.equipo_a].gc += gb;
      statsMap[m.equipo_a].dif += ga - gb;
      statsMap[m.equipo_a].pts += ga > gb ? 3 : ga === gb ? 1 : 0;
    }
    if (statsMap[m.equipo_b]) {
      statsMap[m.equipo_b].pj += 1;
      statsMap[m.equipo_b].gf += gb;
      statsMap[m.equipo_b].gc += ga;
      statsMap[m.equipo_b].dif += gb - ga;
      statsMap[m.equipo_b].pts += gb > ga ? 3 : ga === gb ? 1 : 0;
    }
  }

  const sortedTeams = groupData.equipos
    .map(t => ({ equipo: t.equipo, ...statsMap[t.equipo] }))
    .sort((a, b) => {
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

    </div>
  );
}
